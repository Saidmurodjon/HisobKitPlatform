import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./useAppDispatch.js";
import { logout } from "../store/slices/authSlice.js";
import { useGetMeQuery } from "../store/api/authApi.js";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isInitializing } = useAppSelector((s) => s.auth);

  const { isLoading, isError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (isError) {
      dispatch(logout());
    }
  }, [isError, dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isInitializing,
    logout: () => dispatch(logout()),
  };
}
