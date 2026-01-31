import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Hash, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface Keyword {
  id: string;
  keyword: string;
  response_message: string;
  is_enabled: boolean;
  hit_count: number;
  created_at: string;
}

interface KeywordListProps {
  keywords: Keyword[];
  isLoading?: boolean;
  onEdit: (keyword: Keyword) => void;
  onDelete: (keyword: Keyword) => void;
  onToggleEnabled: (keyword: Keyword, enabled: boolean) => void;
}

export function KeywordList({ keywords, isLoading, onEdit, onDelete, onToggleEnabled }: KeywordListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No keywords configured yet</p>
        <p className="text-xs mt-1">Add your first keyword to enable auto-responses</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead className="hidden sm:table-cell">Response</TableHead>
            <TableHead className="text-center">Hits</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.map((keyword) => (
            <TableRow key={keyword.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    #{keyword.keyword}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell max-w-xs">
                <p className="text-sm text-muted-foreground truncate">
                  {keyword.response_message}
                </p>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-sm font-medium">{keyword.hit_count}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={keyword.is_enabled}
                  onCheckedChange={(checked) => onToggleEnabled(keyword, checked)}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(keyword)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(keyword)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
