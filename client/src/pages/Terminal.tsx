import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Terminal as TerminalIcon, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Terminal() {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<Array<{ command: string; output: string; exitCode: number }>>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const executeMutation = trpc.terminal.execute.useMutation();

  const handleExecute = async () => {
    if (!command.trim()) return;

    const cmd = command;
    setCommand("");

    try {
      const result = await executeMutation.mutateAsync({ command: cmd });
      setOutput((prev) => [
        ...prev,
        {
          command: cmd,
          output: result.output,
          exitCode: result.exitCode,
        },
      ]);
    } catch (error: any) {
      setOutput((prev) => [
        ...prev,
        {
          command: cmd,
          output: error.message || "Command execution failed",
          exitCode: 1,
        },
      ]);
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Terminal</h1>
          <p className="text-muted-foreground mt-1">Execute commands on your Raspberry Pi</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalIcon className="h-5 w-5 text-primary" />
              Command Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={outputRef}
              className="bg-background rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm space-y-3"
            >
              {output.length === 0 ? (
                <div className="text-muted-foreground">
                  Enter a command below to get started...
                </div>
              ) : (
                output.map((entry, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">$</span>
                      <span className="text-foreground">{entry.command}</span>
                    </div>
                    <pre className="text-muted-foreground whitespace-pre-wrap pl-4">
                      {entry.output}
                    </pre>
                    {entry.exitCode !== 0 && (
                      <div className="text-destructive text-xs pl-4">
                        Exit code: {entry.exitCode}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-3 border border-border">
                <span className="text-primary font-mono">$</span>
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                  placeholder="Enter command..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                />
              </div>
              <Button
                onClick={handleExecute}
                disabled={!command.trim() || executeMutation.isPending}
              >
                {executeMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
