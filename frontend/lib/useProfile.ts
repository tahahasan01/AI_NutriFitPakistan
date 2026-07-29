"use client";

// One place that loads/saves the user's body profile so no page ever has to
// ask for age/weight/height/goal again once it's set.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type ProfileData = {
  age: number; gender: number; weight: number; height: number; goal: number; activity: number;
};

const DEFAULTS: ProfileData = { age: 25, gender: 0, weight: 70, height: 175, goal: 0, activity: 2 };

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULTS);
  const [exists, setExists] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<any>("/api/profile")
      .then((p) => {
        if (p?.exists) {
          setProfile({ age: p.age, gender: p.gender, weight: p.weight, height: p.height, goal: p.goal, activity: p.activity });
          setExists(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = (p: ProfileData) => {
    setExists(true);
    return api.put("/api/profile", p).catch(() => {});
  };

  return { profile, setProfile, exists, loaded, save };
}
