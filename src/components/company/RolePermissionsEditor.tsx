import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Bot, Shield, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useRolePermissions,
  DbJobType,
  FeaturePermissions,
  ALL_AI_AGENTS,
  ALL_FEATURES,
  GRANULAR_PERMISSIONS,
  PLATFORM_DEFAULT_AGENTS,
  PLATFORM_DEFAULT_PERMISSIONS,
} from '@/hooks/useRolePermissions';

interface RolePermissionsEditorProps {
  companyId: string;
  jobType: DbJobType;
  jobLabel: string;
}

export function RolePermissionsEditor({ companyId, jobType, jobLabel }: RolePermissionsEditorProps) {
  const {
    getPermissionsForRole,
    getAgentAccessForRole,
    hasCustomPermissions,
    hasCustomAgentAccess,
    updatePermissions,
    bulkUpdateAgentAccess,
    resetToDefaults,
    isUpdating,
    isResetting,
  } = useRolePermissions(companyId);

  const [localPermissions, setLocalPermissions] = useState<FeaturePermissions | null>(null);
  const [localAgentAccess, setLocalAgentAccess] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state from fetched data
  useEffect(() => {
    const permissions = getPermissionsForRole(jobType);
    setLocalPermissions(permissions);

    const agentAccess = getAgentAccessForRole(jobType);
    const agentMap: Record<string, boolean> = {};
    ALL_AI_AGENTS.forEach(agent => {
      agentMap[agent.id] = agentAccess.includes(agent.id);
    });
    setLocalAgentAccess(agentMap);
    setHasChanges(false);
  }, [jobType, getPermissionsForRole, getAgentAccessForRole]);

  const handlePermissionChange = (field: keyof FeaturePermissions, value: boolean) => {
    if (!localPermissions) return;
    setLocalPermissions({ ...localPermissions, [field]: value });
    setHasChanges(true);
  };

  const handleAgentAccessChange = (agentId: string, value: boolean) => {
    setLocalAgentAccess({ ...localAgentAccess, [agentId]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!localPermissions) return;

    // Save permissions
    updatePermissions({ jobType, permissions: localPermissions });

    // Save agent access
    const agents = Object.entries(localAgentAccess).map(([agentType, isEnabled]) => ({
      agentType,
      isEnabled,
    }));
    bulkUpdateAgentAccess({ jobType, agents });

    setHasChanges(false);
  };

  const handleReset = () => {
    resetToDefaults(jobType);
    setHasChanges(false);
  };

  const isCustomized = hasCustomPermissions(jobType) || hasCustomAgentAccess(jobType);
  const defaultAgents = PLATFORM_DEFAULT_AGENTS[jobType] || [];
  const defaultPermissions = PLATFORM_DEFAULT_PERMISSIONS[jobType] || {};

  if (!localPermissions) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions for {jobLabel}
            </CardTitle>
            <CardDescription>
              Customize what employees with this role can access
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isCustomized && (
              <Badge variant="outline" className="text-xs">
                Customized
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={isResetting || !isCustomized}
                  >
                    {isResetting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">Reset to Defaults</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Reset this role to platform default permissions
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Enable or disable AI agent access for this role
            </div>
            <div className="grid gap-3">
              {ALL_AI_AGENTS.map((agent) => {
                const isDefault = defaultAgents.includes(agent.id);
                const isEnabled = localAgentAccess[agent.id] ?? isDefault;
                
                return (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{agent.name}</span>
                        {isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agent.description}
                      </p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleAgentAccessChange(agent.id, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="features" className="mt-4 space-y-4">
            <Accordion type="multiple" defaultValue={['feature-access', 'granular']} className="w-full">
              <AccordionItem value="feature-access">
                <AccordionTrigger>Feature Area Access</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-3 pt-2">
                    {ALL_FEATURES.map((feature) => {
                      const field = feature.field as keyof FeaturePermissions;
                      const isDefault = defaultPermissions[field] ?? false;
                      const isEnabled = localPermissions[field];
                      
                      return (
                        <div
                          key={feature.id}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{feature.name}</span>
                              {isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handlePermissionChange(field, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="granular">
                <AccordionTrigger>Granular Permissions</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-3 pt-2">
                    {GRANULAR_PERMISSIONS.map((perm) => {
                      const field = perm.field as keyof FeaturePermissions;
                      const isDefault = defaultPermissions[field] ?? false;
                      const isEnabled = localPermissions[field];
                      
                      return (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{perm.name}</span>
                              {isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {perm.description}
                            </p>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handlePermissionChange(field, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const permissions = getPermissionsForRole(jobType);
                  setLocalPermissions(permissions);
                  const agentAccess = getAgentAccessForRole(jobType);
                  const agentMap: Record<string, boolean> = {};
                  ALL_AI_AGENTS.forEach(agent => {
                    agentMap[agent.id] = agentAccess.includes(agent.id);
                  });
                  setLocalAgentAccess(agentMap);
                  setHasChanges(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
