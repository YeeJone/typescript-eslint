import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useRulesMeta } from '@site/src/hooks/useRulesMeta';
import type { RulesMeta } from '@site/rulesMeta';

import styles from './styles.module.css';

function interpolateCode(text: string): (JSX.Element | string)[] | string {
  const fragments = text.split(/`(.*?)`/);
  if (fragments.length === 1) {
    return text;
  }
  return fragments.map((v, i) => (i % 2 === 0 ? v : <code key={i}>{v}</code>));
}

function RuleRow({ rule }: { rule: RulesMeta[number] }): JSX.Element | null {
  if (!rule.docs || !rule.docs.url) {
    return null;
  }
  return (
    <tr>
      <td>
        <Link to={new URL(rule.docs.url).pathname}>
          <code>@typescript-eslint/{rule.name}</code>
        </Link>
        <br />
        {interpolateCode(rule.docs.description)}
      </td>
      <td className={styles.attrCol}>
        {rule.docs.recommended === 'strict'
          ? '🔒'
          : rule.docs.recommended
          ? '✅'
          : ''}
      </td>
      <td className={styles.attrCol}>
        {rule.fixable ? '🔧\n' : '\n'}
        {rule.hasSuggestions ? '🛠' : ''}
      </td>
      <td className={styles.attrCol}>
        {rule.docs.requiresTypeChecking ? '💭' : ''}
      </td>
    </tr>
  );
}

const filterModes = ['neutral', 'include', 'exclude'] as const;
type FilterMode = typeof filterModes[number];

function RuleFilterCheckBox({
  label,
  setMode,
  mode,
}: {
  label: string;
  setMode: (mode: FilterMode) => void;
  mode: FilterMode;
}): JSX.Element {
  const toNextMode = (): void =>
    setMode(filterModes[(filterModes.indexOf(mode) + 1) % filterModes.length]);
  return (
    <li className={styles.checkboxListItem}>
      <button
        type="button"
        className={clsx(
          styles.checkboxLabel,
          mode === 'include' && styles.activated,
          mode === 'exclude' && styles.deactivated,
        )}
        onKeyDown={(e): void => {
          if (e.key === 'Enter') {
            toNextMode();
          }
        }}
        onClick={toNextMode}
        aria-label={`Toggle the filter mode. Current: ${mode}`}
      >
        <div
          aria-hidden
          className={clsx(styles.visual, styles[`visual-${mode}`])}
        />
        {label}
      </button>
    </li>
  );
}

function match(mode: FilterMode, value: boolean): boolean | undefined {
  if (mode === 'exclude') {
    return !value;
  }
  if (mode === 'include') {
    return value;
  }
  return undefined;
}

export default function RulesTable({
  extensionRules,
}: {
  extensionRules?: boolean;
}): JSX.Element {
  const rules = useRulesMeta();
  const [showRecommended, setShowRecommended] = useState<FilterMode>('neutral');
  const [showStrict, setShowStrict] = useState<FilterMode>('neutral');
  const [showFixable, setShowFixable] = useState<FilterMode>('neutral');
  const [showHasSuggestions, setShowHasSuggestion] =
    useState<FilterMode>('neutral');
  const [showTypeCheck, setShowTypeCheck] = useState<FilterMode>('neutral');
  const relevantRules = useMemo(
    () =>
      rules
        .filter(r => !!extensionRules === !!r.docs?.extendsBaseRule)
        .filter(r => {
          const opinions = [
            match(
              showRecommended,
              r.docs?.recommended === 'error' || r.docs?.recommended === 'warn',
            ),
            match(showStrict, r.docs?.recommended === 'strict'),
            match(showFixable, !!r.fixable),
            match(showHasSuggestions, !!r.hasSuggestions),
            match(showTypeCheck, !!r.docs?.requiresTypeChecking),
          ].filter((o): o is boolean => o !== undefined);
          return opinions.every(o => o);
        }),
    [
      rules,
      extensionRules,
      showRecommended,
      showStrict,
      showFixable,
      showHasSuggestions,
      showTypeCheck,
    ],
  );
  return (
    <>
      <ul className={clsx('clean-list', styles.checkboxList)}>
        <RuleFilterCheckBox
          mode={showRecommended}
          setMode={(newMode): void => {
            setShowRecommended(newMode);

            if (newMode === 'include' && showStrict === 'include') {
              setShowStrict('exclude');
            }
          }}
          label="✅ recommended"
        />
        <RuleFilterCheckBox
          mode={showStrict}
          setMode={(newMode): void => {
            setShowStrict(newMode);

            if (newMode === 'include' && showRecommended === 'include') {
              setShowRecommended('exclude');
            }
          }}
          label="🔒 strict"
        />
        <RuleFilterCheckBox
          mode={showFixable}
          setMode={setShowFixable}
          label="🔧 fixable"
        />
        <RuleFilterCheckBox
          mode={showHasSuggestions}
          setMode={setShowHasSuggestion}
          label="🛠 has suggestions"
        />
        <RuleFilterCheckBox
          mode={showTypeCheck}
          setMode={setShowTypeCheck}
          label="💭 requires type information"
        />
      </ul>
      <table className={styles.rulesTable}>
        <thead>
          <tr>
            <th className={styles.ruleCol}>Rule</th>
            <th className={styles.attrCol}>✅{'\n'}🔒</th>
            <th className={styles.attrCol}>🔧{'\n'}🛠</th>
            <th className={styles.attrCol}>💭</th>
          </tr>
        </thead>
        <tbody>
          {relevantRules.map(rule => (
            <RuleRow rule={rule} key={rule.name} />
          ))}
        </tbody>
      </table>
    </>
  );
}
