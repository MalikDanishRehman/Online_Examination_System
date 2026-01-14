import {dbg} from '../utils/debugger';

export const getUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) {
      dbg.log("auth.getUser: no user in storage");
      return null;
    }

    const parsed = JSON.parse(raw);
    dbg.log("auth.getUser:", parsed);
    return parsed;
  } catch (err) {
    dbg.log("auth.getUser: JSON parse failed", err);
    return null;
  }
};

export const isLoggedIn = () => {
  const loggedIn = !!getUser();
  dbg.log("auth.isLoggedIn:", loggedIn);
  return loggedIn;
};

export const getRole = () => {
  const role = getUser()?.role;
  dbg.log("auth.getRole:", role);
  return role;
};

export const saveUser = (user) => {
  dbg.log("auth.saveUser:", user);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearUser = () => {
  dbg.log("auth.clearUser");
  localStorage.removeItem("user");
};
