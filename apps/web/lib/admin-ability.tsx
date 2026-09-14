'use client';

import { createMongoAbility, type MongoAbility } from '@casl/ability';
import { createContext, useContext, useMemo } from 'react';
import type { AbilityRule } from '@zenx-go/api-client';

type AdminAbility = MongoAbility<[string, string]>;
const deniedAbility = createMongoAbility<AdminAbility>([]);
const AdminAbilityContext = createContext<AdminAbility>(deniedAbility);

export function AdminAbilityProvider({ rules, children }: Readonly<{ rules: AbilityRule[]; children: React.ReactNode }>) {
  const ability = useMemo(() => createMongoAbility<AdminAbility>(rules), [rules]);
  return <AdminAbilityContext.Provider value={ability}>{children}</AdminAbilityContext.Provider>;
}

export function useAdminAbility() {
  return useContext(AdminAbilityContext);
}

export function can(ability: AdminAbility, action: string, subject: string) {
  return ability.can(action, subject);
}
