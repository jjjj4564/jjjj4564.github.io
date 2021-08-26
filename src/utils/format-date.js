// https://date-fns.org/docs/parse
import parseDate from 'date-fns/parseISO'
// https://date-fns.org/docs/format
import format from 'date-fns/format'

import { zhTW, enUS } from 'date-fns/locale'

const localeMap = {
  'zh-Hant': zhTW,
  en: enUS,
};

export default function formatDate(date, pattern = 'date') {
  if (!date) return;
  if(typeof date === 'string')
    date = parseDate(date);

  const patterMap = {
    date: 'yyyyMMdd', // '2019-06-13'
  };
  const formatPattern = patterMap[pattern] || pattern;

  return format(date, formatPattern, {
    locale: localeMap['zh-Hant'],
  })
}
