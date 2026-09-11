# Local execution and data handling

LitBench is a single-user localhost application. Do not expose its server to
the public internet or put an unauthenticated proxy in front of it. Workspaces
contain your graph, notes, conversations, and import state.

AI operations send selected library context to the chosen CLI's configured
provider. They use the CLI's authentication and account limits; LitBench does
not need or distribute an API key. Paper insertion can retrieve external source
content. Research answers use stored library context and disable external tools
where the CLI supports it.

Paper content is untrusted input. Agent output is validated, and changes require
review before application. Disposable execution directories and the CLI's own
sandbox settings reduce access; these are not a substitute for OS isolation
against a compromised executable. Only configure agent binaries you trust.

Report vulnerabilities privately to the repository maintainer rather than posting
credentials, personal notes, or a working exploit against someone else's machine.
