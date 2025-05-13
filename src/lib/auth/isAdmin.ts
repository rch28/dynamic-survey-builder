import { getServerSession } from "./getServerSession";

export async function isAdmin() {
  const user = await getServerSession();
  if (!user) {
    return false;
  }
  if (user.user_metadata.role !== "admin") {
    return false;
  }
  return true;
}
