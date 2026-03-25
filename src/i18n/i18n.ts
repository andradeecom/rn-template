import { I18n } from 'i18n-js';
import en, { Translations } from './translations/en';
import es from './translations/es';
import pt from './translations/pt';

const translations = {
  en,
  es,
  pt,
};

const i18n = new I18n(translations);

/**
 * Builds up valid keypaths for translations.
 * via: https://stackoverflow.com/a/65333050
 */
type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>;
}[keyof TObj & (string | number)];

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `['${TKey}']` | `.${TKey}`>;
}[keyof TObj & (string | number)];

type RecursiveKeyOfHandleValue<TValue, Text extends string> = TValue extends any[]
  ? Text
  : TValue extends object
    ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
    : Text;

export type TxKeyPath = RecursiveKeyOf<Translations>;
export { i18n };
