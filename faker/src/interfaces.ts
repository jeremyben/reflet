/**
 * @public
 */
export type FakerStatic = typeof import('faker')

/**
 * @public
 */
export type Locale =
	| 'az'
	| 'cz'
	| 'de'
	| 'de_AT'
	| 'de_CH'
	| 'en'
	| 'en_AU'
	| 'en_BORK'
	| 'en_CA'
	| 'en_GB'
	| 'en_IE'
	| 'en_IND'
	| 'en_US'
	| 'en_ZA'
	| 'en_au_ocker'
	| 'es'
	| 'es_MX'
	| 'fa'
	| 'fr'
	| 'fr_CA'
	| 'ge'
	| 'id_ID'
	| 'it'
	| 'ja'
	| 'ko'
	| 'nb_NO'
	| 'nep'
	| 'nl'
	| 'pl'
	| 'pt_BR'
	| 'pt_PT'
	| 'ru'
	| 'sk'
	| 'sv'
	| 'tr'
	| 'uk'
	| 'vi'
	| 'zh_CN'
	| 'zh_TW'

/**
 * @internal
 */
export type FakerNamespaceName = Exclude<KeysOfType<FakerStatic, { [key: string]: (...args: any[]) => any }>, undefined>

/**
 * @internal
 */
export type FakerMethodName<T extends FakerNamespaceName> = keyof FakerStatic[T]

/**
 * @internal
 */
type KeysOfType<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T]

/**
 * @internal
 */
export type Shape<T> = Omit<T, KeysOfType<T, Function>>
