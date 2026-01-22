import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Shield, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { format, addMonths, isAfter, isBefore } from 'date-fns';

interface WarrantyReportFormProps {
  companyId: string;
  onCancel: () => void;
  onAnalyze?: (data: Record<string, unknown>) => void;
}

type ReportView = 'overview' | 'expiring' | 'claims';

export const WarrantyReportForm: React.FC<WarrantyReportFormProps> = ({ companyId, onCancel, onAnalyze: _onAnalyze }) => {
  const [reportView, setReportView] = useState<ReportView>('overview');
  const [equipmentFilter, setEquipmentFilter] = useState('all');

  // Fetch warranty records
  const { data: warrantiesResult } = useQuery({
    queryKey: ['warranty-records', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('warranty_records')
        .select('*')
        .eq('company_id', companyId);
      return data || [];
    },
  });

  // Fetch warranty claims
  const { data: claimsResult } = useQuery({
    queryKey: ['warranty-claims', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('warranty_claims')
        .select('*')
        .eq('company_id', companyId);
      return data || [];
    },
  });

  // Process data
  const { data: warrantyData, isLoading } = useQuery({
    queryKey: ['warranty-report-processed', companyId, warrantiesResult, claimsResult],
    queryFn: async () => {
      const warranties = warrantiesResult || [];
      const claims = claimsResult || [];

      const now = new Date();
      const thirtyDaysFromNow = addMonths(now, 1);

      // Calculate warranty status
      const activeWarranties = warranties.filter(w => {
        const expiryDate = new Date(w.warranty_end_date);
        return isAfter(expiryDate, now);
      });

      const expiredWarranties = warranties.filter(w => {
        const expiryDate = new Date(w.warranty_end_date);
        return isBefore(expiryDate, now);
      });

      const expiringWarranties = warranties.filter(w => {
        const expiryDate = new Date(w.warranty_end_date);
        return isAfter(expiryDate, now) && isBefore(expiryDate, thirtyDaysFromNow);
      });

      // Equipment types
      const equipmentTypes = [...new Set(warranties.map(w => w.equipment_type).filter(Boolean))] as string[];

      // Claims by status
      const pendingClaims = claims.filter(c => c.status === 'pending');
      const approvedClaims = claims.filter(c => c.status === 'approved');
      const deniedClaims = claims.filter(c => c.status === 'denied');

      return {
        warranties,
        activeWarranties,
        expiredWarranties,
        expiringWarranties,
        equipmentTypes,
        claims,
        pendingClaims,
        approvedClaims,
        deniedClaims,
      };
    },
    enabled: !!warrantiesResult && !!claimsResult,
  });

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm">Active Warranties</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{warrantyData?.activeWarranties?.length || 0}</p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{warrantyData?.expiringWarranties?.length || 0}</p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Total Claims</span>
          </div>
          <p className="text-2xl font-bold">{warrantyData?.claims?.length || 0}</p>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Expired</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{warrantyData?.expiredWarranties?.length || 0}</p>
        </div>
      </div>

      {/* Claims Summary */}
      <div className="p-4 rounded-lg bg-background border">
        <h4 className="font-medium mb-3">Claims Summary</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded bg-yellow-50">
            <p className="text-xl font-bold text-yellow-600">{warrantyData?.pendingClaims?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-2 rounded bg-green-50">
            <p className="text-xl font-bold text-green-600">{warrantyData?.approvedClaims?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="text-center p-2 rounded bg-red-50">
            <p className="text-xl font-bold text-red-600">{warrantyData?.deniedClaims?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Denied</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpiring = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        Warranties Expiring Within 30 Days
      </h4>

      {warrantyData?.expiringWarranties && warrantyData.expiringWarranties.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {warrantyData.expiringWarranties.map((warranty) => (
            <div key={warranty.id} className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{warranty.equipment_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {warranty.coverage_type || 'Standard Warranty'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Expires {format(new Date(warranty.warranty_end_date), 'MMM d, yyyy')}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{warranty.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Serial #</p>
                  <p className="font-medium">{warranty.serial_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="font-medium text-green-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            No Warranties Expiring Soon
          </p>
          <p className="text-sm text-green-700 mt-1">
            All active warranties have more than 30 days remaining.
          </p>
        </div>
      )}
    </div>
  );

  const renderClaims = () => (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-500" />
        Recent Claims
      </h4>

      {warrantyData?.claims && warrantyData.claims.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {warrantyData.claims.slice(0, 10).map((claim) => (
            <div key={claim.id} className="p-3 rounded-lg bg-background border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{claim.claim_type || 'Warranty Claim'}</p>
                  <p className="text-xs text-muted-foreground">
                    Claim #{claim.id.slice(0, 8)} • {format(new Date(claim.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge 
                  variant={
                    claim.status === 'approved' ? 'default' : 
                    claim.status === 'denied' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {claim.status}
                </Badge>
              </div>
              {claim.issue_description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {claim.issue_description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-muted-foreground text-center">No warranty claims on record.</p>
        </div>
      )}

      {warrantyData?.pendingClaims && warrantyData.pendingClaims.length > 0 && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="font-medium text-yellow-800">
            {warrantyData.pendingClaims.length} claim(s) pending review
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Review and process pending claims to maintain customer satisfaction.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-teal-200 bg-teal-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            Warranty Report
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportView} onValueChange={(v) => setReportView(v as ReportView)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="claims">Claims</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Equipment Type</Label>
            <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {warrantyData?.equipmentTypes?.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-lg bg-background animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            {reportView === 'overview' && renderOverview()}
            {reportView === 'expiring' && renderExpiring()}
            {reportView === 'claims' && renderClaims()}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
