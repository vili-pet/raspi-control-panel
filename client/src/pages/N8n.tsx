import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, Play, Square, RotateCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function N8n() {
  const { data, refetch } = trpc.n8n.getStatus.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const startMutation = trpc.n8n.start.useMutation();
  const stopMutation = trpc.n8n.stop.useMutation();
  const restartMutation = trpc.n8n.restart.useMutation();

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync();
      toast.success("n8n started successfully");
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to start n8n");
    }
  };

  const handleStop = async () => {
    try {
      await stopMutation.mutateAsync();
      toast.success("n8n stopped successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to stop n8n");
    }
  };

  const handleRestart = async () => {
    try {
      await restartMutation.mutateAsync();
      toast.success("n8n restarted successfully");
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to restart n8n");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">n8n Workflow Automation</h1>
          <p className="text-muted-foreground mt-1">Manage your n8n instance</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!data ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Service Status:</span>
                    {data.isRunning ? (
                      <Badge className="bg-primary text-primary-foreground">Running</Badge>
                    ) : (
                      <Badge variant="secondary">Stopped</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Port:</span>
                    <span className="font-mono text-foreground">{data.port}</span>
                  </div>
                  {data.url && (
                    <div className="pt-2">
                      <Button asChild className="w-full">
                        <a href={data.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open n8n
                        </a>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleStart}
                disabled={data?.isRunning || startMutation.isPending}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start n8n
              </Button>
              <Button
                onClick={handleStop}
                disabled={!data?.isRunning || stopMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop n8n
              </Button>
              <Button
                onClick={handleRestart}
                disabled={restartMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Restart n8n
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>About n8n</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              n8n is a powerful workflow automation tool that helps you connect different
              services and automate tasks. Use it to create custom workflows, integrate
              APIs, and automate repetitive processes.
            </p>
            <p>
              The default port is 5678. Make sure n8n is installed on your Raspberry Pi
              before trying to start it.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
