import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Bot, Shield, Loader2, HelpCircle, Lock } from 'lucide-react';
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
import { useSubscription } from '@/hooks/useSubscription';

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

  const { 
    canAccessAgent, 
    getAgentRequiredTier, 
    canAccessFeatureArea, 
    getFeatureRequiredTier, 
    getTierInfo 
  } = useSubscription();

  const [localPermissions, setLocalPermissions] = useState<FeaturePermissions | null>(null);
  const [localAgentAccess, setLocalAgentAccess] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

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
    updatePermissions({ jobType, permissions: localPermissions });
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
      <Card className="border-border/30">
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="border-border/30 bg-muted/30">
        <CardContent className="p-3">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{jobLabel} Permissions</span>
              {isCustomized && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Custom
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isResetting || !isCustomized}
                  className="h-7 px-2 text-xs"
                >
                  {isResetting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                  <span className="ml-1">Reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to platform defaults</TooltipContent>
            </Tooltip>
          </div>

          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="inline-flex h-auto p-1 bg-muted/30 rounded-full border border-border/50 gap-0.5 flex-wrap mb-2">
              <TabsTrigger value="agents" className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Bot className="h-3 w-3" />
                AI Agents
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Shield className="h-3 w-3" />
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="mt-0 max-h-[280px] overflow-y-auto">
              <div className="grid gap-1">
                {ALL_AI_AGENTS.map((agent) => {
                  const isDefault = defaultAgents.includes(agent.id);
                  const isEnabled = localAgentAccess[agent.id] ?? isDefault;
                  const isAvailable = canAccessAgent(agent.id);
                  const requiredTier = getAgentRequiredTier(agent.id);
                  const requiredTierInfo = requiredTier ? getTierInfo(requiredTier) : null;
                  
                  return (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between rounded border border-border/30 px-2.5 py-1.5 ${
                        isAvailable ? 'hover:bg-muted/50' : 'opacity-60 bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-sm font-medium truncate ${!isAvailable ? 'text-muted-foreground' : ''}`}>
                          {agent.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-primary shrink-0 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">{agent.description}</p>
                            {!isAvailable && requiredTierInfo && (
                              <>
                                <Separator className="my-1.5" />
                                <p className="text-xs text-amber-500 flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Upgrade to {requiredTierInfo.label} to enable
                                </p>
                              </>
                            )}
                          </TooltipContent>
                        </Tooltip>
                        {!isAvailable ? (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 text-muted-foreground">
                            <Lock className="h-2.5 w-2.5 mr-0.5" />
                            Locked
                          </Badge>
                        ) : isDefault ? (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                            Default
                          </Badge>
                        ) : null}
                      </div>
                      <Switch
                        checked={isAvailable ? isEnabled : false}
                        onCheckedChange={(checked) => handleAgentAccessChange(agent.id, checked)}
                        disabled={!isAvailable}
                        className={`scale-90 ${!isAvailable ? 'opacity-50' : ''}`}
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-0 max-h-[280px] overflow-y-auto space-y-2">
              <div className="space-y-1">
                <p className="text-[10px] uppercase text-card-foreground font-medium px-1">Feature Access</p>
                <div className="grid gap-1">
                  {ALL_FEATURES.map((feature) => {
                    const field = feature.field as keyof FeaturePermissions;
                    const isDefault = defaultPermissions[field] ?? false;
                    const isEnabled = localPermissions[field];
                    const isAvailable = canAccessFeatureArea(field);
                    const requiredTier = getFeatureRequiredTier(field);
                    const requiredTierInfo = requiredTier ? getTierInfo(requiredTier) : null;
                    
                    return (
                      <div
                        key={feature.id}
                        className={`flex items-center justify-between rounded border border-border/30 px-2.5 py-1.5 ${
                          isAvailable ? 'hover:bg-muted/50' : 'opacity-60 bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-sm font-medium truncate ${!isAvailable ? 'text-muted-foreground' : ''}`}>
                            {feature.name}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-primary shrink-0 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              <p className="text-xs">{feature.description}</p>
                              {!isAvailable && requiredTierInfo && (
                                <>
                                  <Separator className="my-1.5" />
                                  <p className="text-xs text-amber-500 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Upgrade to {requiredTierInfo.label} to enable
                                  </p>
                                </>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          {!isAvailable ? (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 text-muted-foreground">
                              <Lock className="h-2.5 w-2.5 mr-0.5" />
                              Locked
                            </Badge>
                          ) : isDefault ? (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                              Default
                            </Badge>
                          ) : null}
                        </div>
                        <Switch
                          checked={isAvailable ? isEnabled : false}
                          onCheckedChange={(checked) => handlePermissionChange(field, checked)}
                          disabled={!isAvailable}
                          className={`scale-90 ${!isAvailable ? 'opacity-50' : ''}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase text-card-foreground font-medium px-1">Record Permissions</p>
                <div className="grid grid-cols-2 gap-1">
                  {GRANULAR_PERMISSIONS.map((perm) => {
                    const field = perm.field as keyof FeaturePermissions;
                    const isDefault = defaultPermissions[field] ?? false;
                    const isEnabled = localPermissions[field];
                    
                    return (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between rounded border border-border/30 px-2 py-1.5 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">{perm.name}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-2.5 w-2.5 text-primary shrink-0 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[180px]">
                              {perm.description}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handlePermissionChange(field, checked)}
                          className="scale-75"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {hasChanges && (
            <>
              <Separator className="my-2" />
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
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
                <Button onClick={handleSave} disabled={isUpdating} size="sm" className="h-7 px-3 text-xs">
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
