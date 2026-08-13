import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Copy, Check, ExternalLink, Terminal, Bot, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstagramLink } from "@/components/InstagramIcon";

const APP_NAME = "idealnie pasuje";
const APP_SLUG = "idealnie-pasuje";

function deriveMcpUrl(): string {
  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (!projectRef || projectRef === "project-ref-unset") {
    return "https://<project-ref>.supabase.co/functions/v1/mcp";
  }
  return `https://${projectRef}.supabase.co/functions/v1/mcp`;
}

function escapeShellSingleQuote(value: string): string {
  return value.replace(/'/g, "'\\'");
}

export default function AgentConnect() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const mcpUrl = useMemo(() => deriveMcpUrl(), []);
  const encodedName = useMemo(() => encodeURIComponent(APP_NAME), []);
  const encodedUrl = useMemo(() => encodeURIComponent(mcpUrl), []);
  const claudeConnectUrl = useMemo(
    () =>
      `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodedName}&connectorUrl=${encodedUrl}`,
    [encodedName, encodedUrl],
  );
  const chatgptConnectUrl = "https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins";
  const claudeCodeCommand = useMemo(
    () => `claude mcp add --scope user --transport http ${APP_SLUG} '${escapeShellSingleQuote(mcpUrl)}'`,
    [mcpUrl],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard support
      const textarea = document.createElement("textarea");
      textarea.value = mcpUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCommand = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">
              idealnie<span className="text-accent">pasuje</span>
            </span>
          </Link>
          <InstagramLink className="w-5 h-5 text-foreground" />
        </div>
      </header>

      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10 md:mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI assistant
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Connect an AI assistant
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Use ChatGPT, Claude, or any MCP client with your idealnie pasuje account. The assistant will only see the data you have access to.
            </p>
          </div>

          <Card className="mb-8 shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">MCP server URL</CardTitle>
              <CardDescription>
                Copy this URL and paste it into your AI assistant when asked for a server address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 rounded-lg border border-border bg-muted px-4 py-3 font-mono text-sm break-all text-foreground">
                  {mcpUrl}
                </div>
                <Button onClick={handleCopy} className="bg-cta text-cta-foreground hover:bg-cta/90 shrink-0">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="chatgpt" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted">
              <TabsTrigger value="chatgpt" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <MessageSquare className="w-4 h-4" />
                ChatGPT
              </TabsTrigger>
              <TabsTrigger value="claude" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Bot className="w-4 h-4" />
                Claude
              </TabsTrigger>
              <TabsTrigger value="claude-code" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Terminal className="w-4 h-4" />
                Claude Code
              </TabsTrigger>
              <TabsTrigger value="other" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4" />
                Other
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chatgpt" className="mt-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-xl">ChatGPT</CardTitle>
                  <CardDescription>
                    Connect through ChatGPT's custom Connectors (requires Developer mode).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Connect</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>
                        Open{" "}
                        <a
                          href="https://chatgpt.com/#settings/Connectors/Advanced"
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          ChatGPT Settings → Connectors → Advanced
                          <ExternalLink className="w-3 h-3" />
                        </a>{" "}
                        and enable Developer mode.
                      </li>
                      <li>
                        Open the{" "}
                        <a
                          href={chatgptConnectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          new connector dialog
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        .
                      </li>
                      <li>Paste the app name "{APP_NAME}" and the MCP URL above into the name and URL fields.</li>
                      <li>Review the details, check the confirmation, and click Create.</li>
                      <li>Enable the app from the chat composer, then ask ChatGPT to use idealnie pasuje.</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Refresh after the app changes</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Open ChatGPT's Plugins page and select this app.</li>
                      <li>Scroll to Information and click Refresh.</li>
                      <li>If the URL changed, delete the app from Plugins and repeat the connect steps above.</li>
                      <li>Start a new chat and ask ChatGPT to use idealnie pasuje.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claude" className="mt-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-xl">Claude</CardTitle>
                  <CardDescription>
                    Add a custom connector in Claude with the URL prefilled.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Connect</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>
                        Open the{" "}
                        <a
                          href={claudeConnectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          add custom connector page
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        .
                      </li>
                      <li>Review the details and click Add.</li>
                      <li>
                        If the prefilled form does not open, go to Claude's Connectors page, choose "Add custom connector", name it "{APP_NAME}", and paste the MCP URL above.
                      </li>
                      <li>Enable the connector from the chat composer, then ask Claude to use idealnie pasuje.</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Refresh after the app changes</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Open the Connectors page and select this connector.</li>
                      <li>Refresh or update the connector's tools.</li>
                      <li>If the URL changed, remove the connector and repeat the connect steps above.</li>
                      <li>Ask Claude to use idealnie pasuje.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claude-code" className="mt-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-xl">Claude Code</CardTitle>
                  <CardDescription>
                    Connect from a terminal with one command. No config-file editing needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Connect</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Run this command in a terminal, then start Claude Code and run <code>/mcp</code> to confirm the connection. Sign in when prompted.
                    </p>
                    <div className="relative rounded-lg border border-border bg-muted p-4 font-mono text-sm text-foreground overflow-x-auto">
                      <button
                        onClick={() => copyCommand(claudeCodeCommand)}
                        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
                        aria-label="Copy command"
                        title="Copy command"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <code className="block pr-8">{claudeCodeCommand}</code>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Refresh after the app changes</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Start a new Claude Code session — it loads the latest tools when it connects.</li>
                      <li>
                        If the URL changed, run <code>claude mcp remove {APP_SLUG}</code>, then run the install command again with the latest URL.
                      </li>
                      <li>Ask Claude Code to use idealnie pasuje.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="other" className="mt-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-xl">Other MCP clients</CardTitle>
                  <CardDescription>
                    For any AI assistant that supports remote MCP servers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Connect</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Open the client's MCP server or custom connector settings.</li>
                      <li>Create a remote MCP server connection.</li>
                      <li>Name it "{APP_NAME}" and paste the MCP URL above.</li>
                      <li>Finish any sign-in or authorization prompts.</li>
                      <li>Enable the connection, then ask the assistant to use idealnie pasuje.</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Refresh after the app changes</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Open the client's MCP server or connector settings.</li>
                      <li>Select the connection created for this app.</li>
                      <li>Refresh the tool list, reload the server, or reconnect it.</li>
                      <li>If the URL changed, paste the latest URL from above.</li>
                      <li>Start a new chat or session and ask the assistant to use idealnie pasuje.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            The connected assistant can only access the data and actions allowed by your account. It does not bypass any privacy rules or database policies.
          </p>
        </div>
      </main>

      <footer className="py-6 border-t border-border bg-card/50">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <Link to="/" className="font-semibold text-foreground hover:text-accent">
            idealniepasuje
          </Link>
          <span>© 2026 idealniepasuje. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
