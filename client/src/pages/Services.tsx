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
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCw, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Services() {
  const { data, refetch } = trpc.services.list.useQuery();
  const startMutation = trpc.services.start.useMutation();
  const stopMutation = trpc.services.stop.useMutation();
  const restartMutation = trpc.services.restart.useMutation();

  const handleStart = async (name: string) => {
    try {
      await startMutation.mutateAsync({ name });
      toast.success(`Started ${name}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to start service");
    }
  };

  const handleStop = async (name: string) => {
    try {
      await stopMutation.mutateAsync({ name });
      toast.success(`Stopped ${name}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to stop service");
    }
  };

  const handleRestart = async (name: string) => {
    try {
      await restartMutation.mutateAsync({ name });
      toast.success(`Restarted ${name}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to restart service");
    }
  };

  const getStatusBadge = (active: string) => {
    if (active === "active") {
      return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
    } else if (active === "inactive") {
      return <Badge variant="secondary">Inactive</Badge>;
    } else if (active === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="outline">{active}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Services</h1>
            <p className="text-muted-foreground mt-1">Manage system services</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>System Services</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.services.map((service) => (
                    <TableRow key={service.name}>
                      <TableCell className="font-mono text-sm">
                        {service.name}
                      </TableCell>
                      <TableCell>{getStatusBadge(service.active)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {service.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStart(service.name)}
                            disabled={service.active === "active"}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStop(service.name)}
                            disabled={service.active !== "active"}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestart(service.name)}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
