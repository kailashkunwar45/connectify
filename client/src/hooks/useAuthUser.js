import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";

const useAuthUser = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // cache 5 minutes
  });

  const authUser = useMemo(() => {
    return data ? { ...data.user, streamToken: data.streamToken, streamApiKey: data.streamApiKey } : null;
  }, [data]);

  return { authUser, isLoading, refetch };
};

export default useAuthUser;
