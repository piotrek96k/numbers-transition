import type { CancellationToken, CompilerHost, Diagnostic, Program, SourceFile } from 'typescript';
import type { PluginConfig } from 'ts-patch';

interface SuppressDiagnosticsConfig extends PluginConfig {
  codes?: number[];
}

const suppressDiagnostics = (
  { getSemanticDiagnostics, ...restProgram }: Program,
  _: CompilerHost | undefined,
  { codes = [] }: SuppressDiagnosticsConfig,
): Program => ({
  ...restProgram,
  getSemanticDiagnostics: (...args: [SourceFile, CancellationToken]): readonly Diagnostic[] =>
    getSemanticDiagnostics(...args).filter(({ code }: Diagnostic): boolean => !codes.includes(code)),
});

export default suppressDiagnostics;

export type { SuppressDiagnosticsConfig };
