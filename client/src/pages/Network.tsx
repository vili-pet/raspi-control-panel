import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network as NetworkIcon, Wifi, Globe } from "lucide-react";

export default function Network() {
  const { data } = trpc.raspiSystem.getNetworkInfo.useQuery();

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading network info...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const externalInterfaces = data.interfaces.filter((iface) => !iface.internal);
  const internalInterfaces = data.interfaces.filter((iface) => iface.internal);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Network</h1>
          <p className="text-muted-foreground mt-1">Network configuration and status</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                External Interfaces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {externalInterfaces.length === 0 ? (
                <p className="text-muted-foreground text-sm">No external interfaces found</p>
              ) : (
                externalInterfaces.map((iface, index) => (
                  <div
                    key={index}
                    className="p-4 bg-background rounded-lg border border-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{iface.name}</span>
                      <Badge variant="outline">{iface.family}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP Address:</span>
                        <span className="font-mono text-foreground">{iface.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Netmask:</span>
                        <span className="font-mono text-foreground">{iface.netmask}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MAC:</span>
                        <span className="font-mono text-foreground">{iface.mac}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NetworkIcon className="h-5 w-5 text-primary" />
                Internal Interfaces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {internalInterfaces.length === 0 ? (
                <p className="text-muted-foreground text-sm">No internal interfaces found</p>
              ) : (
                internalInterfaces.map((iface, index) => (
                  <div
                    key={index}
                    className="p-4 bg-background rounded-lg border border-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{iface.name}</span>
                      <Badge variant="outline">{iface.family}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP Address:</span>
                        <span className="font-mono text-foreground">{iface.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Netmask:</span>
                        <span className="font-mono text-foreground">{iface.netmask}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {data.wifiStatus && data.wifiStatus !== "N/A" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                WiFi Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap bg-background p-4 rounded-lg">
                {data.wifiStatus}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
