import { useState, useEffect } from "react";
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";
import MenuHome from "./components/MenuHome";
import MenuPeserta, { DEFAULT_PARTICIPANTS } from "./components/MenuPeserta";
import MenuSebaran from "./components/MenuSebaran";
import MenuAlumni from "./components/MenuAlumni";
import MenuImport, {
  DEFAULT_TRAINING_TYPES,
  DEFAULT_KEJURUAN,
  DEFAULT_PROGRAMS
} from "./components/MenuImport";
import { DatabaseState, TrainingType, Kejuruan, ProgramPelatihan } from "./types";
import { ensureSignedIn } from "./lib/auth";
import {
  subscribeToParticipants,
  subscribeToTrainingTypes,
  subscribeToKejuruan,
  subscribeToPrograms,
  saveParticipant,
  deleteParticipant,
  saveTrainingType,
  deleteTrainingType,
  saveKejuruan,
  deleteKejuruan,
  saveProgram,
  deleteProgram,
  seedMasterDataIfEmpty,
  seedParticipantsIfEmpty,
  resetDatabaseToDefault,
  subscribeToSettings
} from "./lib/firestore";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMenu, setActiveMenu] = useState("home");

  // Centralized Database State
  const [dbState, setDbState] = useState<DatabaseState>({
    participants: [],
    trainingTypes: [],
    kejuruanList: [],
    programs: []
  });

  // Subscribe and Seed master data on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    let unsubParticipants = () => {};
    let unsubTrainingTypes = () => {};
    let unsubKejuruan = () => {};
    let unsubPrograms = () => {};
    let unsubSettings = () => {};

    const start = async () => {
      try {
        await ensureSignedIn();
        if (!active) return;

        // Initial seeding
        try {
          await seedMasterDataIfEmpty({
            trainingTypes: DEFAULT_TRAINING_TYPES,
            kejuruanList: DEFAULT_KEJURUAN,
            programs: DEFAULT_PROGRAMS
          });
          const preventReseeding = localStorage.getItem("prevent_reseeding") === "true";
          if (!preventReseeding) {
            await seedParticipantsIfEmpty(DEFAULT_PARTICIPANTS);
          }
        } catch (err) {
          console.error("Failed to seed database initial state:", err);
        }

        if (!active) return;

        // Subscribe to all collections
        unsubParticipants = subscribeToParticipants(
          (list) => {
            if (active) {
              // Self-healing: Find any participants with inconsistent disabilitas fields and fix them in background
              const needsHealing = list.filter(p => {
                if (p.penyandangDisabilitas === "Ya" || !p.disabilitasTipe || p.disabilitasTipe.trim() === "-" || p.disabilitasTipe.trim().toLowerCase() === "none") {
                  const tipeDis = (p.disabilitasTipe || "").trim().toLowerCase();
                  const isNotDisabled = 
                    !tipeDis ||
                    tipeDis === "tidak" || 
                    tipeDis === "tidak ada" || 
                    tipeDis === "tidak ada disabilitas" || 
                    tipeDis === "tidak disabilitas" || 
                    tipeDis === "normal" || 
                    tipeDis === "-" || 
                    tipeDis === "none" || 
                    tipeDis === "t" || 
                    tipeDis === "n" || 
                    tipeDis === "no" || 
                    tipeDis === "bukan";
                  
                  if (isNotDisabled && p.penyandangDisabilitas === "Ya") {
                    return true;
                  }
                  if (isNotDisabled && (!p.disabilitasTipe || p.disabilitasTipe.trim() !== "Tidak")) {
                     return true; // Needs normalization of the string to "Tidak"
                  }
                }
                return false;
              });

              if (needsHealing.length > 0) {
                console.log(`Self-healing: fixing ${needsHealing.length} participants with incorrect disability status...`);
                needsHealing.forEach(p => {
                  const healed = { ...p, penyandangDisabilitas: "Tidak" as const, disabilitasTipe: "Tidak" };
                  saveParticipant(healed).catch(err => console.error("Self healing failed for", p.id, err));
                });
              }

              // Apply the same correction inline to the displayed list instantly
              const correctedList = list.map(p => {
                const tipeDis = (p.disabilitasTipe || "").trim().toLowerCase();
                const isNotDisabled = 
                  !tipeDis ||
                  tipeDis === "tidak" || 
                  tipeDis === "tidak ada" || 
                  tipeDis === "tidak ada disabilitas" || 
                  tipeDis === "tidak disabilitas" || 
                  tipeDis === "normal" || 
                  tipeDis === "-" || 
                  tipeDis === "none" || 
                  tipeDis === "t" || 
                  tipeDis === "n" || 
                  tipeDis === "no" || 
                  tipeDis === "bukan";
                
                if (isNotDisabled) {
                  return { ...p, penyandangDisabilitas: "Tidak", disabilitasTipe: "Tidak" };
                }
                return p;
              });

              setDbState(prev => ({ ...prev, participants: correctedList }));
            }
          },
          (err) => console.error("Subscription error participants:", err)
        );

        unsubTrainingTypes = subscribeToTrainingTypes(
          (list) => {
            if (active) setDbState(prev => ({ ...prev, trainingTypes: list as TrainingType[] }));
          },
          (err) => console.error("Subscription error trainingTypes:", err)
        );

        unsubKejuruan = subscribeToKejuruan(
          (list) => {
            if (active) setDbState(prev => ({ ...prev, kejuruanList: list as Kejuruan[] }));
          },
          (err) => console.error("Subscription error kejuruan:", err)
        );

        unsubPrograms = subscribeToPrograms(
          (list) => {
            if (active) setDbState(prev => ({ ...prev, programs: list as ProgramPelatihan[] }));
          },
          (err) => console.error("Subscription error programs:", err)
        );

        unsubSettings = subscribeToSettings(
          (settings) => {
            if (active) setDbState(prev => ({ ...prev, settings }));
          },
          (err) => console.error("Subscription error settings:", err)
        );
      } catch (err) {
        console.error("Auth / Database initialization failed:", err);
      }
    };

    start();

    return () => {
      active = false;
      unsubParticipants();
      unsubTrainingTypes();
      unsubKejuruan();
      unsubPrograms();
      unsubSettings();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !dbState.participants.length) return;

    const existingProgramNames = new Set(dbState.programs.map(p => p.nama.toLowerCase().trim()));
    const existingTypeNames = new Set(dbState.trainingTypes.map(t => t.nama.toLowerCase().trim()));
    const existingKejuruanNames = new Set(dbState.kejuruanList.map(k => k.nama.toLowerCase().trim()));
    
    const missingPrograms: ProgramPelatihan[] = [];
    const missingTypes: TrainingType[] = [];
    const missingKejuruan: Kejuruan[] = [];

    dbState.participants.forEach((p, idx) => {
      if (p.programPelatihan) {
        const programClean = p.programPelatihan.trim();
        const kejuruanClean = (p.kejuruan || "").trim();
        if (programClean && !existingProgramNames.has(programClean.toLowerCase())) {
          const id = `pr-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
          missingPrograms.push({
            id,
            nama: programClean,
            kejuruan: kejuruanClean || "Umum"
          });
          existingProgramNames.add(programClean.toLowerCase());
        }
      }
      
      if (p.jenisPelatihan) {
        const typeClean = p.jenisPelatihan.trim();
        if (typeClean && !existingTypeNames.has(typeClean.toLowerCase())) {
          const id = `t-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
          missingTypes.push({
            id,
            nama: typeClean,
            deskripsi: "Ditambahkan otomatis"
          });
          existingTypeNames.add(typeClean.toLowerCase());
        }
      }
      
      if (p.kejuruan) {
        const kejuruanClean = p.kejuruan.trim();
        if (kejuruanClean && !existingKejuruanNames.has(kejuruanClean.toLowerCase())) {
          const id = `k-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
          missingKejuruan.push({
            id,
            nama: kejuruanClean
          });
          existingKejuruanNames.add(kejuruanClean.toLowerCase());
        }
      }
    });

    if (missingPrograms.length > 0 || missingTypes.length > 0 || missingKejuruan.length > 0) {
      console.log(`Self-healing: adding ${missingPrograms.length} programs, ${missingTypes.length} types, ${missingKejuruan.length} kejuruan...`);
      
      missingPrograms.forEach(prog => {
        saveProgram(prog).catch(err => console.error("Self healing failed for program", prog.id, err));
      });
      missingTypes.forEach(t => {
        saveTrainingType(t).catch(err => console.error("Self healing failed for type", t.id, err));
      });
      missingKejuruan.forEach(k => {
        saveKejuruan(k).catch(err => console.error("Self healing failed for kejuruan", k.id, err));
      });
      
      // Update local state optimisticly
      setDbState(prev => ({
        ...prev,
        programs: [...prev.programs, ...missingPrograms],
        trainingTypes: [...prev.trainingTypes, ...missingTypes],
        kejuruanList: [...prev.kejuruanList, ...missingKejuruan]
      }));
    }
  }, [dbState.participants, dbState.programs, dbState.trainingTypes, dbState.kejuruanList, isAuthenticated]);

  const handleUpdateDb = async (updates: Partial<DatabaseState>) => {
    try {
      if (updates.participants) {
        const currentIds = dbState.participants.map(p => p.id);
        const nextParticipants = updates.participants;
        
        // Write added/updated items
        for (const p of nextParticipants) {
          const existing = dbState.participants.find(x => x.id === p.id);
          if (!existing || JSON.stringify(existing) !== JSON.stringify(p)) {
            await saveParticipant(p);
          }
        }
        
        // Delete removed items
        const nextIds = nextParticipants.map(p => p.id);
        for (const id of currentIds) {
          if (!nextIds.includes(id)) {
            await deleteParticipant(id);
          }
        }
      }

      if (updates.trainingTypes) {
        const currentIds = dbState.trainingTypes.map(t => t.id);
        const nextTypes = updates.trainingTypes;
        
        for (const t of nextTypes) {
          const existing = dbState.trainingTypes.find(x => x.id === t.id);
          if (!existing || JSON.stringify(existing) !== JSON.stringify(t)) {
            await saveTrainingType(t);
          }
        }
        
        const nextIds = nextTypes.map(t => t.id);
        for (const id of currentIds) {
          if (!nextIds.includes(id)) {
            await deleteTrainingType(id);
          }
        }
      }

      if (updates.kejuruanList) {
        const currentIds = dbState.kejuruanList.map(k => k.id);
        const nextKejuruan = updates.kejuruanList;
        
        for (const k of nextKejuruan) {
          const existing = dbState.kejuruanList.find(x => x.id === k.id);
          if (!existing || JSON.stringify(existing) !== JSON.stringify(k)) {
            await saveKejuruan(k);
          }
        }
        
        const nextIds = nextKejuruan.map(k => k.id);
        for (const id of currentIds) {
          if (!nextIds.includes(id)) {
            await deleteKejuruan(id);
          }
        }
      }

      if (updates.programs) {
        const currentIds = dbState.programs.map(p => p.id);
        const nextPrograms = updates.programs;
        
        for (const p of nextPrograms) {
          const existing = dbState.programs.find(x => x.id === p.id);
          if (!existing || JSON.stringify(existing) !== JSON.stringify(p)) {
            await saveProgram(p);
          }
        }
        
        const nextIds = nextPrograms.map(p => p.id);
        for (const id of currentIds) {
          if (!nextIds.includes(id)) {
            await deleteProgram(id);
          }
        }
      }
    } catch (err) {
      console.error("Error committing updates to Firestore:", err);
    }
  };

  const handleResetDb = async () => {
    localStorage.removeItem("prevent_reseeding");
    await resetDatabaseToDefault({
      participants: DEFAULT_PARTICIPANTS,
      trainingTypes: DEFAULT_TRAINING_TYPES,
      kejuruanList: DEFAULT_KEJURUAN,
      programs: DEFAULT_PROGRAMS
    });
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <DashboardLayout 
      activeMenu={activeMenu} 
      onMenuChange={setActiveMenu}
      onLogout={() => setIsAuthenticated(false)}
    >
      {activeMenu === "home" && <MenuHome dbState={dbState} />}
      {activeMenu === "peserta" && <MenuPeserta dbState={dbState} />}
      {activeMenu === "sebaran" && <MenuSebaran dbState={dbState} />}
      {activeMenu === "alumni" && <MenuAlumni dbState={dbState} />}
      {activeMenu === "import" && (
        <MenuImport 
          dbState={dbState} 
          onUpdateDb={handleUpdateDb} 
          onResetDb={handleResetDb} 
        />
      )}
    </DashboardLayout>
  );
}
