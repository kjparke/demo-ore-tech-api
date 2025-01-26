const permissions = {
  // High level Admin roles
  1: {
    canReadAll: true,
    canWriteAll: true,
    canUpdateAll: true,
    canDeleteAll: true,
    canReadNotes: true,
    canWriteNotes: true,
    canUpdateNotes: true,
    canDeleteNotes: true,
  },
  2: {
    canReadAll: true,
    canWriteAll: true,
    canUpdateAll: true,
    canDeleteAll: false,
    canReadNotes: true,
    canWriteNotes: true,
    canUpdateNotes: true,
    canDeleteNotes: true,
  },
  3: {
    canReadAll: true,
    canWriteAll: true,
    canUpdateAll: false,
    canDeleteAll: false,
    canReadNotes: true,
    canWriteNotes: true,
    canUpdateNotes: true,
    canDeleteNotes: true,
  },

  // Supervisors
  4: {
    canReadAll: true,
    canWriteAll: true,
    canUpdateAll: false,
    canDeleteAll: false,
    canReadNotes: true,
    canWriteNotes: true,
    canUpdateNotes: true,
    canDeleteNotes: true,
  },

  // Low-level - Notes only
  5: {
    canReadAll: true,
    canWriteAll: false,
    canUpdateAll: false,
    canDeleteAll: false,
    canReadNotes: true,
    canWriteNotes: true,
    canUpdateNotes: true,
    canDeleteNotes: true,
  },
};

module.exports = permissions;
