import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    identity: string;
    role: "host" | "teacher";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      identity: string;
      role: "host" | "teacher";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    identity: string;
    role: "host" | "teacher";
  }
}
