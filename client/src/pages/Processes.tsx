import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Processes() {
  const { data, refetch } = trpc.raspiSystem.getProcesses.useQuery();
  const killMutation = trpc.raspiSystem.killProcess.useMutation();

  const handleKill = async (pid: string) => {
    if (!confirm(`Are you sure you want to kill process ${pid}?`)) return;

    try {
      await killMutation.mutateAsync({ pid });
      toast.success(`Process ${pid} killed`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to kill process");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Processes</h1>
            <p className="text-muted-foreground mt-1">View and manage running processes</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Top Processes by CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>CPU%</TableHead>
                      <TableHead>MEM%</TableHead>
                      <TableHead>Command</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.processes.map((proc) => (
                      <TableRow key={proc.pid}>
                        <TableCell className="font-mono text-sm">{proc.pid}</TableCell>
                        <TableCell className="text-muted-foreground">{proc.user}</TableCell>
                        <TableCell className="font-mono">{proc.cpu}%</TableCell>
                        <TableCell className="font-mono">{proc.mem}%</TableCell>
                        <TableCell className="font-mono text-sm max-w-md truncate">
                          {proc.command}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleKill(proc.pid)}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
