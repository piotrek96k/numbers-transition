import type { CancellationToken, CompilerHost, Diagnostic, PluginConfig, Program, SourceFile } from 'typescript';

interface SuppressDiagnosticsConfig extends PluginConfig {
  codes?: number[];
}

export default (
  { getSemanticDiagnostics, ...restProgram }: Program,
  _: CompilerHost | undefined,
  { codes = [] }: SuppressDiagnosticsConfig,
): Program => ({
  ...restProgram,
  getSemanticDiagnostics: (...args: [SourceFile, CancellationToken]): readonly Diagnostic[] =>
    getSemanticDiagnostics(...args).filter(({ code }: Diagnostic): boolean => !codes.includes(code)),
});
