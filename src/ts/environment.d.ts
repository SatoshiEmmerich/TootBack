declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOOTBACK_IS_LOCAL: boolean;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
