import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

const SRC_DIR = 'H:/AAVIL Inc/DataX/DataX/src';

const BROWSER_GLOBALS = new Set([
  'window', 'document', 'navigator', 'location', 'history',
  'localStorage', 'sessionStorage', 'console', 'setTimeout',
  'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
  'cancelAnimationFrame', 'fetch', 'Headers', 'Request', 'Response',
  'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader', 'FormData',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'HTMLElement',
  'Element', 'Node', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'WebSocket', 'Worker', 'performance', 'alert', 'confirm', 'prompt',
  'getComputedStyle', 'matchMedia', 'crypto', 'atob', 'btoa', 'AbortController',
  // JS Built-ins
  'Object', 'Function', 'Array', 'String', 'Boolean', 'Number', 'BigInt',
  'Date', 'RegExp', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError',
  'Math', 'JSON', 'Promise', 'Proxy', 'Reflect', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'ArrayBuffer', 'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'Symbol', 'Intl', 'Infinity', 'NaN', 'undefined', 'isNaN', 'isFinite', 'parseInt', 'parseFloat',
  // Node / bundler
  'process', 'module', 'exports', 'require', '__dirname', '__filename', 'global',
  // React JSX
  'React', 'arguments'
]);

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.git' && item !== 'dist') {
        files = files.concat(getAllFiles(full, exts));
      }
    } else {
      if (exts.includes(path.extname(item))) {
        files.push(full);
      }
    }
  }
  return files;
}

const allFiles = getAllFiles(SRC_DIR);
let totalErrors = 0;

for (const file of allFiles) {
  const code = fs.readFileSync(file, 'utf-8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (err) {
    console.error(`[Syntax Error] in ${file}:${err.loc?.line}:${err.loc?.column} - ${err.message}`);
    totalErrors++;
    continue;
  }

  const undefinedInFile = [];

  traverse(ast, {
    Identifier(path) {
      const name = path.node.name;

      // Skip properties: foo.bar, foo?.bar
      if (
        (path.parent.type === 'MemberExpression' || path.parent.type === 'OptionalMemberExpression') &&
        path.parent.property === path.node &&
        !path.parent.computed
      ) {
        return;
      }

      // Skip MetaProperty: import.meta
      if (path.parent.type === 'MetaProperty') {
        return;
      }

      // Skip object property keys: { bar: 1 } (skip 'bar')
      if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node && !path.parent.computed) {
        return;
      }
      // Skip object method keys: { bar() {} }
      if (path.parent.type === 'ObjectMethod' && path.parent.key === path.node && !path.parent.computed) {
        return;
      }
      // Skip class property/method keys
      if ((path.parent.type === 'ClassProperty' || path.parent.type === 'ClassMethod') && path.parent.key === path.node && !path.parent.computed) {
        return;
      }
      // Skip label identifiers
      if (path.parent.type === 'LabeledStatement' || path.parent.type === 'BreakStatement' || path.parent.type === 'ContinueStatement') {
        return;
      }
      // Skip declarations (const name =, function name(), etc.)
      if (path.parent.type === 'VariableDeclarator' && path.parent.id === path.node) {
        return;
      }
      if (path.parent.type === 'FunctionDeclaration' && path.parent.id === path.node) {
        return;
      }
      if (path.parent.type === 'FunctionExpression' && path.parent.id === path.node) {
        return;
      }
      if (path.parent.type === 'ClassDeclaration' && path.parent.id === path.node) {
        return;
      }
      if (path.parent.type === 'ImportSpecifier' || path.parent.type === 'ImportDefaultSpecifier' || path.parent.type === 'ImportNamespaceSpecifier') {
        return;
      }
      if (path.parent.type === 'ExportSpecifier') {
        // If it's a re-export from another module: export { foo } from './bar'
        if (path.parentPath?.parent?.source) {
          return;
        }
        // In export { foo }, check if foo is bound in scope
        if (path.parent.local === path.node) {
          if (!path.scope.hasBinding(name) && !BROWSER_GLOBALS.has(name)) {
            undefinedInFile.push({ name, line: path.node.loc?.start?.line, col: path.node.loc?.start?.column });
          }
        }
        return;
      }
      if (path.parent.type === 'RestElement') {
        return;
      }
      if (path.parent.type === 'AssignmentPattern' && path.parent.left === path.node) {
        return;
      }

      // Check if binding exists in Babel scope
      if (!path.scope.hasBinding(name) && !BROWSER_GLOBALS.has(name)) {
        undefinedInFile.push({
          name,
          line: path.node.loc?.start?.line,
          col: path.node.loc?.start?.column
        });
      }
    },

    JSXIdentifier(path) {
      const name = path.node.name;
      // If parent is JSXMemberExpression or JSXAttribute, skip
      if (path.parent.type === 'JSXAttribute' || (path.parent.type === 'JSXMemberExpression' && path.parent.property === path.node)) {
        return;
      }
      // If it starts with uppercase, it's a Component reference
      if (/^[A-Z]/.test(name)) {
        if (!path.scope.hasBinding(name) && !BROWSER_GLOBALS.has(name)) {
          undefinedInFile.push({
            name,
            line: path.node.loc?.start?.line,
            col: path.node.loc?.start?.column,
            isJsx: true
          });
        }
      }
    }
  });

  if (undefinedInFile.length > 0) {
    const relPath = path.relative(SRC_DIR, file);
    console.log(`\n❌ ${relPath}:`);
    for (const err of undefinedInFile) {
      console.log(`   Line ${err.line}:${err.col} -> ReferenceError: '${err.name}' is not defined`);
      totalErrors++;
    }
  }
}

console.log(`\n=== Total Real Linting / ReferenceErrors Found: ${totalErrors} ===`);
