// src/hooks/useRole.js


import { useAuth } from "../context/AuthContext";

export const ROLES = {
  HOD:         "HOD",
  APU_OFFICER: "APU_OFFICER",
  NUC_VISITOR: "NUC_VISITOR",
};

export function useRole() {
  const { user } = useAuth();
  const role = user?.role || null;

  return {
    role,
    isHOD:        role === ROLES.HOD,
    isAPU:        role === ROLES.APU_OFFICER,
    isNUCVisitor: role === ROLES.NUC_VISITOR,
    isStaff:      role === ROLES.HOD || role === ROLES.APU_OFFICER,

    // Granular permissions
    can: {
      // Programmes
      viewAllProgrammes:    role === ROLES.APU_OFFICER,
      createProgramme:      role === ROLES.HOD || role === ROLES.APU_OFFICER,
      approveProgramme:     role === ROLES.APU_OFFICER,
      editProgramme:        role === ROLES.HOD || role === ROLES.APU_OFFICER,
      deleteProgramme:      role === ROLES.APU_OFFICER,

      // Documents
      uploadDocument:       role === ROLES.HOD || role === ROLES.APU_OFFICER,
      editDocument:         role === ROLES.HOD || role === ROLES.APU_OFFICER,
      deleteDocument:       role === ROLES.HOD || role === ROLES.APU_OFFICER,
      verifyDocument:       role === ROLES.APU_OFFICER,
      viewUnverifiedDocs:   role === ROLES.HOD || role === ROLES.APU_OFFICER,

      // Team
      manageTeam:           role === ROLES.APU_OFFICER,
      inviteTeamMember:     role === ROLES.APU_OFFICER,

      // Notifications
      viewNotifications:    role === ROLES.HOD || role === ROLES.APU_OFFICER,

      // Navigation
      viewDashboard:        role === ROLES.HOD || role === ROLES.APU_OFFICER,
      viewTeamPortal:       true, // all roles, but different views
      viewCalculator:       true,
      viewSettings:         true,
    },
  };
}