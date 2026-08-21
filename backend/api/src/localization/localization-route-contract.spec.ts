import {
  EXCEPTION_FILTERS_METADATA,
  METHOD_METADATA,
  MODULE_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../app.module';
import { LocaleInterceptor } from './locale.interceptor';
import { LocalizationModule } from './localization.module';
import { LocalizedExceptionFilter } from './localized-exception.filter';
import { buildInitialTranslationCatalog } from '../translations/translation-catalog.seed';

type ClassType = abstract new (...args: never[]) => unknown;
type ProviderDefinition = {
  readonly provide?: unknown;
  readonly useClass?: unknown;
};

interface RegisteredRoute {
  readonly controller: ClassType;
  readonly handler: (...args: never[]) => unknown;
  readonly identity: string;
}

describe('localized contract across registered routes', () => {
  const routes = collectRoutes(AppModule);
  const providers = (Reflect.getMetadata(
    MODULE_METADATA.PROVIDERS,
    LocalizationModule,
  ) ?? []) as ProviderDefinition[];

  it('registers the locale interceptor and exception filter globally', () => {
    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: APP_INTERCEPTOR,
          useClass: LocaleInterceptor,
        }),
        expect.objectContaining({
          provide: APP_FILTER,
          useClass: LocalizedExceptionFilter,
        }),
      ]),
    );
  });

  it('walks every route and rejects filters that could bypass the contract', () => {
    expect(routes.length).toBeGreaterThan(100);
    expect(new Set(routes.map((route) => route.identity)).size).toBe(
      routes.length,
    );

    for (const route of routes) {
      expect(
        Reflect.getMetadata(EXCEPTION_FILTERS_METADATA, route.controller) ?? [],
      ).toEqual([]);
      expect(
        Reflect.getMetadata(EXCEPTION_FILTERS_METADATA, route.handler) ?? [],
      ).toEqual([]);
    }
  });

  it('routes ValidationPipe errors through the same structured boundary', () => {
    const mainSource = readFileSync(join(__dirname, '..', 'main.ts'), 'utf8');
    expect(mainSource).toContain(
      'exceptionFactory: localizedValidationException',
    );
  });

  it('seeds every error message key emitted by server source', () => {
    const sourceRoot = join(__dirname, '..');
    const emittedKeys = new Set<string>();
    for (const file of typeScriptFiles(sourceRoot)) {
      if (file.endsWith('.spec.ts')) continue;
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/['"](error\.[a-z0-9_.-]+)['"]/g)) {
        if (match[1]) emittedKeys.add(match[1]);
      }
    }

    const catalog = buildInitialTranslationCatalog();
    for (const languageIsoCode of ['en', 'ro']) {
      const seededKeys = new Set(
        catalog
          .filter((item) => item.languageIsoCode === languageIsoCode)
          .map((item) => item.key),
      );
      expect(
        Array.from(emittedKeys).filter((key) => !seededKeys.has(key)),
      ).toEqual([]);
    }
  });
});

function collectRoutes(root: ClassType): RegisteredRoute[] {
  const modules = collectModules(root);
  const routes: RegisteredRoute[] = [];

  for (const moduleType of modules) {
    const controllers = (Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      moduleType,
    ) ?? []) as ClassType[];
    for (const controller of controllers) {
      const controllerPath = String(
        Reflect.getMetadata(PATH_METADATA, controller) ?? '',
      );
      const prototype = controller.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(prototype)) {
        if (name === 'constructor') continue;
        const handler = prototype[name];
        if (typeof handler !== 'function') continue;
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as
          number | undefined;
        if (method === undefined) continue;
        const path = String(Reflect.getMetadata(PATH_METADATA, handler) ?? '');
        routes.push({
          controller,
          handler: handler as (...args: never[]) => unknown,
          identity: `${method}:${controllerPath}/${path}`,
        });
      }
    }
  }
  return routes;
}

function collectModules(root: ClassType): ReadonlySet<ClassType> {
  const visited = new Set<ClassType>();
  const pending: unknown[] = [root];

  while (pending.length > 0) {
    const candidate = pending.pop();
    const moduleType = dynamicModuleType(candidate);
    if (!moduleType || visited.has(moduleType)) continue;
    visited.add(moduleType);
    const imports = (Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleType) ??
      []) as unknown[];
    pending.push(...imports);
  }
  return visited;
}

function dynamicModuleType(candidate: unknown): ClassType | undefined {
  if (typeof candidate === 'function') return candidate as ClassType;
  if (candidate && typeof candidate === 'object' && 'module' in candidate) {
    const moduleType = (candidate as { readonly module?: unknown }).module;
    if (typeof moduleType === 'function') return moduleType as ClassType;
  }
  return undefined;
}

function typeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
  });
}
