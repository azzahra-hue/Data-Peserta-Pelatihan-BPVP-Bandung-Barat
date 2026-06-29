# Security Specification: BPVP Bandung Barat Firestore Security Rules

This document specifies the data invariants, vulnerability tests, and security rules design for the BPVP Bandung Barat Portal Data Vokasi.

## 1. Data Invariants
- **Participant Access**: Only authenticated users are allowed to read and write participant records.
- **Data Completeness**: Every participant document must conform to the required schema, specifying training type, status of completion, gender, and age limits (0 to 150).
- **Mutations validation**: Any update to participant documents must preserve schema types and limit string sizes to prevent denial of wallet attacks or buffer pollution.

## 2. The "Dirty Dozen" Malicious Payloads
Here are 12 JSON payloads designed to break our database rules, which MUST be rejected (`PERMISSION_DENIED`):

1. **Unauthenticated Read**: Attempt to read `participants` without an active auth token.
2. **Unauthenticated Write**: Attempt to write a participant document without an active auth token.
3. **Poisoned Participant ID**: Creating a participant with a 1.5KB long ID containing junk characters.
4. **Invalid Age (Negative)**: Creating a participant with `usia: -10`.
5. **Invalid Age (Extreme)**: Creating a participant with `usia: 999`.
6. **Invalid Gender**: Setting `jenisKelamin: "X"`.
7. **Invalid Disabilitas**: Setting `penyandangDisabilitas: "Maybe"`.
8. **Invalid Status Kebekerjaan**: Setting `statusKebekerjaan: "Pensiun"`.
9. **Missing Required Fields**: Creating a participant without a `nama` or `alamat`.
10. **Type Pollution (String as Int)**: Submitting `usia: "dua puluh lima"`.
11. **Size Limit Abuse**: Submitting a participant record where `nama` is a 1MB string.
12. **Malicious Key Injection**: Creating a participant with an extra unauthorized property like `isAdmin: true` or `isVerified: true`.

## 3. Test Runner
Below is the verification plan (`firestore.rules.test.ts`) that conceptually validates that all the above 12 payloads fail when tested against the rules.
