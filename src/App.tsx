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
  resetDatabaseToDefault
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
    let active = true;
    let unsubParticipants = () => {};
    let unsubTrainingTypes = () => {};
    let unsubKejuruan = () => {};
    let unsubPrograms = () => {};

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

        // Subscribe to all 4 collections
        unsubParticipants = subscribeToParticipants(
          (list) => {
            if (active) setDbState(prev => ({ ...prev, participants: list }));
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
    };
  }, []);

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
      {activeMenu === "peserta" && <MenuPeserta participants={dbState.participants} />}
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
