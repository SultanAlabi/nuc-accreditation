import { useAuth } from "../context/AuthContext";

export const STATUS = {
  PENDING:          "PENDING",
  IN_REVIEW:        "IN_REVIEW",
  FORWARDED_TO_NUC: "FORWARDED_TO_NUC",
  ACCREDITED:       "ACCREDITED",
  DENIED:           "DENIED",
};

export const DOCUMENT_CATEGORIES = [
  { value: "CURRICULUM", label: "Curriculum" },
  { value: "STAFF_LIST", label: "Staff List" },
  { value: "FACILITY",   label: "Facility"   },
  { value: "FINANCIAL",  label: "Financial"  },
  { value: "OTHER",      label: "Other"      },
];

export function useRole() {
  const { user } = useAuth();
  const role = user?.role || null;
  
  return {
    role,
    user,
    isHOD: role === "HOD",
    isAPU: role === "APU",
    isNUC: role === "NUC_VISITOR",
    can: {
      createProgramme: role === "HOD",
      submitForReview: role === "HOD",
      forwardToNUC:    role === "APU",
      accreditOrDeny:  role === "NUC_VISITOR",
      uploadDocument:  role === "HOD",
      verifyDocument:  role === "APU",
      deleteDocument:  role === "HOD" || role === "APU",
      manageTeam:      role === "APU",
    },
  };
}