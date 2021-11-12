/**
 * Headers containing more information about the resource to be fetched or about the client itself.
 *
 * https://developer.mozilla.org/en-US/docs/Glossary/Request_header
 *
 * @public
 */
export const RequestHeader = <const>{
	//
	// ═════════ CORS Request Headers ═════════
	//
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_request_headers

	/**
	 * Used when issuing a preflight request to let the server know which HTTP headers will be used
	 * when the actual request is made.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers
	 */
	AccessControlRequestHeaders: 'access-control-request-headers',

	/**
	 * Used when issuing a preflight request to let the server know which HTTP method will be used
	 * when the actual request is made.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method
	 */
	AccessControlRequestMethod: 'access-control-request-method',

	/**
	 * Indicates where a fetch originates from.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin
	 */
	Origin: 'origin',

	//
	// ═════════ Authentication ═════════
	//

	/**
	 * Contains the credentials to authenticate a user agent with a server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.8
	 */
	Authorization: 'authorization',

	/**
	 * Contains the credentials to authenticate a user agent with a proxy server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.34
	 */
	ProxyAuthorization: 'proxy-authorization',

	//
	// ═════════ Content negotiation ═════════
	//
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation

	/**
	 * Informs the server about the types of data that can be sent back. It is MIME-type.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1
	 */
	Accept: 'accept',

	/**
	 * Informs the server about which character set the client is able to understand.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Charset
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.2
	 */
	AcceptCharset: 'accept-charset',

	/**
	 * Informs the server about the encoding algorithm, usually a compression algorithm,
	 * that can be used on the resource sent back.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
	 */
	AcceptEncoding: 'accept-encoding',

	/**
	 * Informs the server about the language the server is expected to send back.
	 * This is a hint and is not necessarily under the full control of the user:
	 * the server should always pay attention not to override an explicit user choice
	 * (like selecting a language in a drop down list).
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4
	 */
	AcceptLanguage: 'accept-language',

	//
	// ═════════ Caching ═════════
	//

	// General header
	/**
	 * Specifies directives for caching mechanisms in both requests and responses.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
	 */
	CacheControl: 'cache-control',

	// General header
	/**
	 * Implementation-specific header that may have various effects anywhere along the request-response chain.
	 * Used for backwards compatibility with HTTP/1.0 caches where the `Cache-Control` header is not yet present.
	 * @deprecated
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.32
	 */
	Pragma: 'pragma',

	//
	// ═════════ Transfer coding ═════════
	//

	/**
	 * Specifies the transfer encodings the user agent is willing to accept.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/TE
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.39
	 */
	TE: 'te',

	//
	// ═════════ Request context ═════════
	//

	/**
	 * Contains an Internet email address for a human user who controls the requesting user agent.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/From
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.22
	 */
	From: 'from',

	/**
	 * Specifies the domain name of the server (for virtual hosting), and (optionally) the TCP port number on which the server is listening.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Host
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.23
	 */
	Host: 'host',

	/**
	 * The address of the previous web page from which a link to the currently requested page was followed.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.36
	 */
	Referer: 'referer',

	/**
	 * Contains a characteristic string that allows the network protocol peers to identify
	 * the application type, operating system, software vendor or software version
	 * of the requesting software user agent.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.43
	 */
	UserAgent: 'user-agent',

	//
	// ═════════ Controls ═════════
	//

	/**
	 * Indicates expectations that need to be fulfilled by the server in order to properly handle the request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.20
	 */
	Expect: 'expect',

	/**
	 * Provides a mechanism with the `TRACE` and `OPTIONS` methods to limit the number
	 * of proxies or gateways that can forward the request to the next inbound server.
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.31
	 */
	MaxForwards: 'max-forwards',

	//
	// ═════════ Proxies ═════════
	//

	/**
	 * Contains information from the client-facing side of proxy servers
	 * that is altered or lost when a proxy is involved in the path of the request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
	 */
	Forwarded: 'forwarded',

	/**
	 * Identifies the originating IP addresses of a client connecting to a web server
	 * through an HTTP proxy or a load balancer.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
	 */
	XForwardedFor: 'x-forwarded-for',

	/**
	 * Identifies the original host requested that a client used to connect to your proxy or load balancer.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host
	 */
	XForwardedHost: 'x-forwarded-host',

	/**
	 * Identifies the protocol (HTTP or HTTPS) that a client used to connect to your proxy or load balancer.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
	 */
	XForwardedProto: 'x-forwarded-proto',

	// General header
	/**
	 * Added by proxies, both forward and reverse proxies, and can appear in the request headers and the response headers.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Via
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.45
	 */
	Via: 'via',

	//
	// ═════════ Conditionals ═════════
	//

	/**
	 * Makes the request conditional and applies the method only if the stored resource matches one of the given ETags.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match
	 */
	IfMatch: 'if-match',

	/**
	 * Makes the request conditional and applies the method only if the stored resource doesn't match any of the given ETags.
	 *
	 * This is used to update caches (for safe requests), or to prevent to upload a new resource when one is already existing.
	 *
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
	 */
	IfNoneMatch: 'if-none-match',

	/**
	 * Makes the request conditional and expects the entity to be transmitted only if it has been modified after the given date.
	 *
	 * This is used to transmit data only when the cache is out of date.
	 *
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
	 */
	IfModifiedSince: 'if-modified-since',

	/**
	 * Makes the request conditional and expects the entity to be transmitted only if it has not been modified after the given date.
	 *
	 * This is used to ensure the coherence of a new fragment of a specific range with previous ones,
	 * or to implement an optimistic concurrency control system when modifying existing documents.
	 *
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Unmodified-Since
	 */
	IfUnmodifiedSince: 'if-unmodified-since',

	//
	// ═════════ Range requests ═════════
	//

	/**
	 * Indicates the part of a document that the server should return.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35
	 */
	Range: 'range',

	/**
	 * Creates a conditional range request that is only fulfilled if the given etag or date matches the remote resource.
	 * Used to prevent downloading two ranges from incompatible version of the resource.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Range
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.27
	 */
	IfRange: 'if-range',

	//
	// ═════════ Cookies ═════════
	//

	/**
	 * Contains stored HTTP cookies previously sent by the server with the `Set-Cookie` header.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cookie
	 */
	Cookie: 'cookie',

	//
	// ═════════ Do Not Track ═════════
	//

	/**
	 * Used for expressing the user's tracking preference.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/DNT
	 */
	DNT: 'dnt',

	//
	// ═════════ Connection management ═════════
	//

	// General header
	/**
	 * Controls whether the network connection stays open after the current transaction finishes.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.10
	 */
	Connection: 'connection',

	// General header
	/**
	 *
	 * Controls how long a persistent connection should stay open.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive
	 *
	 */
	KeepAlive: 'keep-alive',

	//
	// ═════════ Downloads ═════════
	//

	// General header
	/**
	 * Is a response header if the resource transmitted should be displayed `inline`
	 * (default behavior when the header is not present),
	 * or it should be handled like a download or `attachment` and the browser should present a 'Save As' window.
	 *
	 * Is a general header when used on the subpart of a multipart body to give information about the field it applies to.
	 *
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
	 */
	ContentDisposition: 'content-disposition',

	//
	// ═════════ Security ═════════
	//

	/**
	 * Sends a signal to the server expressing the client’s preference for an encrypted and authenticated response,
	 * and that it can successfully handle the `upgrade-insecure-requests` directive.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade-Insecure-Requests
	 */
	UpgradeInsecureRequests: 'upgrade-insecure-requests',

	/**
	 * Mainly used to identify Ajax requests. Most JavaScript frameworks send this field with value of XMLHttpRequest.
	 */
	XRequestedWith: 'x-requested-with',

	/**
	 * Used to prevent cross-site request forgery.
	 *
	 * https://en.wikipedia.org/wiki/Cross-site_request_forgery#Cookie-to-header_token
	 */
	XCSRFToken: 'x-csrf-token',

	//
	// ═════════ Client Hints ═════════
	//

	/**
	 * Indicates the user agent's preference for reduced data usage.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Save-Data
	 */
	SaveData: 'save-data',

	//
	// ═════════ Other ═════════
	//

	// General header
	/**
	 * A general warning field containing information about possible problems.
	 * @deprecated
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Warning
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.46
	 */
	Warning: 'warning',

	// General header
	/**
	 * Contains the date and time at which the message was originated.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Date
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18
	 */
	Date: 'date',

	// General header
	/**
	 * The standard establishes rules for upgrading or changing to a different protocol on the current client, server, transport protocol connection.
	 *
	 * For example, this header standard allows a client to change from HTTP 1.1 to HTTP 2.0,
	 * assuming the server decides to acknowledge and implement the Upgrade header field.
	 * Neither party is required to accept the terms specified in the Upgrade header field.
	 *
	 * It can be used in both client and server headers. If the Upgrade header field is specified,
	 * then the sender MUST also send the Connection header field with the upgrade option specified.
	 *
	 *
	 * https://tools.ietf.org/html/rfc7230#section-6.7
	 */
	Upgrade: 'upgrade',

	/**
	 * Requests a web application to override the method specified in the request (typically `POST`)
	 * with the method given in the header field (typically `PUT` or `DELETE`).
	 *
	 * This can be used when a user agent or firewall prevents `PUT` or `DELETE` methods from being sent directly
	 * (note that this is either a bug in the software component, which ought to be fixed,
	 * or an intentional configuration, in which case bypassing it may be the wrong thing to do).
	 *
	 *
	 * https://opensocial.github.io/spec/2.5.1/Core-API-Server.xml#rfc.section.2.1.1.1
	 */
	XHttpMethodOverride: 'x-http-method-override',

	/**
	 * Connection-specific header field that includes parameters that govern the HTTP/2 connection,
	 * provided in anticipation of the server accepting the request to upgrade from HTTP/1.1 to HTTP/2.
	 *
	 * https://httpwg.org/specs/rfc7540.html#Http2SettingsHeader
	 */
	Http2Settings: 'http2-settings',

	//
	// ═════════ Entity Headers ═════════
	//

	/**
	 * Indicates the size of the entity-body, in decimal number of octets, sent to the recipient.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.13
	 */
	ContentLength: 'content-length',

	/**
	 * Indicates the media type of the resource.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17
	 */
	ContentType: 'content-type',

	/**
	 * MD5 digest of the entity-body for the purpose of providing
	 * an end-to-end message integrity check (MIC) of the entity-body.
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.15
	 */
	ContentMd5: 'content-md5',
}

export type RequestHeader = typeof RequestHeader[keyof typeof RequestHeader]

// ────────────────────────────────────────────────────────────────────────────

/**
 * Headers with additional information about the response, like its location or about the server itself (name and version etc.).
 *
 * https://developer.mozilla.org/en-US/docs/Glossary/Response_header
 *
 * @public
 */
export const ResponseHeader = <const>{
	//
	// ═════════ CORS Response Headers ═════════
	//
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers

	/**
	 * Indicates whether the response can be shared.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
	 */
	AccessControlAllowOrigin: 'access-control-allow-origin',

	/**
	 * Indicates whether the response to the request can be exposed when the credentials flag is true.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
	 */
	AccessControlAllowCredentials: 'access-control-allow-credentials',

	/**
	 * Used in response to a preflight request to indicate which HTTP headers can be used when making the actual request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
	 */
	AccessControlAllowHeaders: 'access-control-allow-headers',

	/**
	 * Specifies the method or methods allowed when accessing the resource in response to a preflight request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
	 */
	AccessControlAllowMethods: 'access-control-allow-methods',

	/**
	 * Indicates which headers can be exposed as part of the response by listing their names.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
	 */
	AccessControlExposeHeaders: 'access-control-expose-headers',

	/**
	 * Indicates how long the results of a preflight request can be cached.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
	 */
	AccessControlMaxAge: 'access-control-max-age',

	/**
	 * Used to remove the path restriction by including this header in the response of the serviceworker script.
	 *
	 * https://w3c.github.io/ServiceWorker/#path-restriction
	 *
	 * https://w3c.github.io/ServiceWorker/#service-worker-allowed
	 */
	ServiceWorkerAllowed: 'service-worker-allowed',

	/**
	 * Specifies origins that are allowed to see values of attributes retrieved via features of the Resource Timing API,
	 * which would otherwise be reported as zero due to cross-origin restrictions.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin
	 */
	TimingAllowOrigin: 'timing-allow-origin',

	/**
	 * Specifies if a cross-domain policy file (crossdomain.xml) is allowed. The file may define a policy to grant web clients,
	 * such as Adobe's Flash Player, Adobe Acrobat (PDF Reader), Microsoft Silverlight and Apache Flex,
	 * permission to handle data across domains that would otherwise be restricted due to the Same-Origin Policy.
	 *
	 * https://www.adobe.com/devnet/articles/crossdomain_policy_file_spec.html
	 *
	 * https://helmetjs.github.io/docs/crossdomain/
	 */
	XPermittedCrossDomainPolicies: 'x-permitted-cross-domain-policies',

	//
	// ═════════ Authentication ═════════
	//

	/**
	 * Defines the authentication method that should be used to gain access to a resource.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.47
	 */
	WwwAuthenticate: 'www-authenticate',

	/**
	 * Defines the authentication method that should be used to gain access to a resource behind a Proxy server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authenticate
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.33
	 */
	ProxyAuthenticate: 'proxy-authenticate',

	//
	// ═════════ Caching ═════════
	//

	// General header
	/**
	 * Specifies directives for caching mechanisms in both requests and responses.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
	 */
	CacheControl: 'cache-control',

	// General header
	/**
	 * Implementation-specific header that may have various effects anywhere along the request-response chain.
	 * Used for backwards compatibility with HTTP/1.0 caches where the `Cache-Control` header is not yet present.
	 * @deprecated
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.32
	 */
	Pragma: 'pragma',

	/**
	 * The time in seconds the object has been in a proxy cache.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Age
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17
	 */
	Age: 'age',

	/**
	 * Clears browsing data (e.g. cookies, storage, cache) associated with the requesting website.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data
	 */
	ClearSiteData: 'clear-site-data',

	// entity header ?
	/**
	 * The date/time after which the response is considered stale.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.21
	 */
	Expires: 'expires',

	//
	// ═════════ Request context ═════════
	//

	/**
	 * Governs which referrer information sent in the `Referer` header should be included with requests made.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
	 *
	 * https://helmetjs.github.io/docs/referrer-policy/
	 */
	ReferrerPolicy: 'referrer-policy',

	//
	// ═════════ Response context ═════════
	//

	/**
	 * Contains information about the software used by the origin server to handle the request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.38
	 */
	Server: 'server',

	//
	// ═════════ Downloads ═════════
	//

	// General header
	/**
	 * Is a response header if the resource transmitted should be displayed `inline`
	 * (default behavior when the header is not present),
	 * or it should be handled like a download or `attachment` and the browser should present a 'Save As' window.
	 *
	 * Is a general header when used on the subpart of a multipart body to give information about the field it applies to.
	 *
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
	 */
	ContentDisposition: 'content-disposition',

	//
	// ═════════ Redirects ═════════
	//

	/**
	 * Indicates the URL to redirect a page to.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location
	 */
	Location: 'location',

	//
	// ═════════ Proxies ═════════
	//

	// General header
	/**
	 * Added by proxies, both forward and reverse proxies, and can appear in the request headers and the response headers.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Via
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.45
	 */
	Via: 'via',

	//
	// ═════════ Conditionals ═════════
	//

	// entity header ?
	/**
	 * It is a validator, the last modification date of the resource, used to compare several versions of the same resource.
	 *
	 * It is less accurate than `ETag`, but easier to calculate in some environments.
	 * Conditional requests using `If-Modified-Since` and `If-Unmodified-Since` use this value
	 * to change the behavior of the request.
	 *
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.29
	 */
	LastModified: 'last-modified',

	/**
	 * It is a validator, a unique string identifying the version of the resource.
	 * Conditional requests using `If-Match` and `If-None-Match` use this value to change the behavior of the request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.19
	 */
	ETag: 'etag',

	/**
	 * Determines how to match future request headers to decide whether a cached response can be used
	 * rather than requesting a fresh one from the origin server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary
	 */
	Vary: 'vary',

	//
	// ═════════ Range requests ═════════
	//

	/**
	 * Indicates if the server supports range requests, and if so in which unit the range can be expressed.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Ranges
	 */
	AcceptRanges: 'accept-ranges',

	//
	// ═════════ Transfer coding ═════════
	//

	// General header
	/**
	 * Specifies the form of encoding used to safely transfer the entity to the user.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.41
	 */
	TransferEncoding: 'transfer-encoding',

	// General header
	/**
	 * Allows the sender to include additional fields at the end of chunked message.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Trailer
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.40
	 */
	Trailer: 'trailer',

	//
	// ═════════ Cookies ═════════
	//

	/**
	 * Send cookies from the server to the user agent.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
	 */
	SetCookie: 'set-cookie',

	//
	// ═════════ Do Not Track ═════════
	//

	/**
	 * Indicates the tracking status that applied to the corresponding request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Tk
	 */
	Tk: 'tk',

	//
	// ═════════ Connection management ═════════
	//

	// General header
	/**
	 * Controls whether the network connection stays open after the current transaction finishes.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.10
	 */
	Connection: 'connection',

	// General header
	/**
	 *
	 * Controls how long a persistent connection should stay open.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive
	 *
	 */
	KeepAlive: 'keep-alive',

	//
	// ═════════ Security ═════════
	//

	/**
	 * Prevents other domains from opening/controlling a window.
	 * (COOP)
	 *
	 * https://www.chromestatus.com/feature/5432089535053824
	 */
	CrossOriginOpenerPolicy: 'cross-origin-opener-policy',

	/**
	 * Prevents other domains from reading the response of the resources to which this header is applied.
	 * (CORP)
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy
	 */
	CrossOriginResourcePolicy: 'cross-origin-resource-policy',

	/**
	 * Controls resources the user agent is allowed to load for a given page.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
	 *
	 * https://helmetjs.github.io/docs/csp/
	 */
	ContentSecurityPolicy: 'content-security-policy',

	/**
	 * Allows web developers to experiment with policies by monitoring, but not enforcing, their effects.
	 * These violation reports consist of JSON documents sent via an HTTP POST request to the specified URI.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only
	 */
	ContentSecurityPolicyReportOnly: 'content-security-policy-report-only',

	/**
	 * Allows sites to opt in to reporting and/or enforcement of Certificate Transparency requirements,
	 * which prevents the use of misissued certificates for that site from going unnoticed.
	 * When a site enables the `Expect-CT` header, they are requesting that Chrome check
	 * that any certificate for that site appears in public CT logs.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect-CT
	 *
	 * https://helmetjs.github.io/docs/expect-ct/
	 */
	ExpectCT: 'expect-ct',

	/**
	 * Provides a mechanism to allow and deny the use of browser features in its own frame,
	 * and in iframes that it embeds.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
	 *
	 * https://helmetjs.github.io/docs/feature-policy/
	 */
	FeaturePolicy: 'feature-policy',

	/**
	 * Associates a specific cryptographic public key with a certain web server to decrease
	 * the risk of {@link https://developer.mozilla.org/en-US/docs/Glossary/MITM | MITM} attacks with forged certificates.
	 * (HPKP)
	 * @deprecated
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Public-Key-Pins
	 */
	PublicKeyPins: 'public-key-pins',

	/**
	 * Sends reports to the report-uri specified in the header and does still allow clients
	 * to connect to the server even if the pinning is violated.
	 * @deprecated
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Public-Key-Pins-Report-Only
	 */
	PublicKeyPinsReportOnly: 'public-key-pins-report-only',

	/**
	 * Force communication using HTTPS instead of HTTP.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
	 *
	 * https://helmetjs.github.io/docs/hsts/
	 */
	StrictTransportSecurity: 'strict-transport-security',

	/**
	 * Disables MIME sniffing and forces browser to use the type given in `Content-Type`.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
	 *
	 * https://helmetjs.github.io/docs/dont-sniff-mimetype/
	 */
	XContentTypeOptions: 'x-content-type-options',

	/**
	 * Indicates that the browser (Internet Explorer) should not display the option
	 * to "Open" a file that has been downloaded from an application, to prevent phishing attacks
	 * as the file otherwise would gain access to execute in the context of the application.
	 * @deprecated
	 *
	 * https://helmetjs.github.io/docs/ienoopen/
	 */
	XDownloadOptions: 'x-download-options',

	/**
	 * Indicates whether a browser should be allowed to render a page in a `<frame>,` `<iframe>`, `<embed>` or `<object>`.
	 * (XFO)
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
	 *
	 * https://helmetjs.github.io/docs/frameguard/
	 */
	XFrameOptions: 'x-frame-options',

	/**
	 * May be set by hosting environments or other frameworks and contains information
	 * about them while not providing any usefulness to the application or its visitors.
	 * Unset this header to avoid exposing potential vulnerabilities.
	 *
	 * https://helmetjs.github.io/docs/hide-powered-by/
	 */
	XPoweredBy: 'x-powered-by',

	/**
	 * Enables cross-site scripting filtering.
	 * @deprecated
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
	 *
	 * https://helmetjs.github.io/docs/xss-filter/
	 */
	XXSSProtection: 'x-xss-protection',

	//
	// ═════════ Other ═════════
	//

	// General header
	/**
	 * A general warning field containing information about possible problems.
	 * @deprecated
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Warning
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.46
	 */
	Warning: 'warning',

	// General header
	/**
	 * Contains the date and time at which the message was originated.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Date
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18
	 */
	Date: 'date',

	// General header
	/**
	 * The standard establishes rules for upgrading or changing to a different protocol on the current client, server, transport protocol connection.
	 *
	 * For example, this header standard allows a client to change from HTTP 1.1 to HTTP 2.0,
	 * assuming the server decides to acknowledge and implement the Upgrade header field.
	 * Neither party is required to accept the terms specified in the Upgrade header field.
	 *
	 * It can be used in both client and server headers. If the Upgrade header field is specified,
	 * then the sender MUST also send the Connection header field with the upgrade option specified.
	 *
	 * https://tools.ietf.org/html/rfc7230#section-6.7
	 */
	Upgrade: 'upgrade',

	/**
	 * Specifies the patch document formats accepted by the server.
	 *
	 * Its presence in response to any method is an implicit indication
	 * that `PATCH` is allowed on the resource identified by the Request-URI.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Patch
	 */
	AcceptPatch: 'accept-patch',

	/**
	 * Used to list alternate ways to reach this service.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Alt-Svc
	 */
	AltSvc: 'alt-svc',

	/**
	 * Indicates how long the user agent should wait before making a follow-up request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.37
	 */
	RetryAfter: 'retry-after',

	/**
	 * Controls DNS prefetching, a feature by which browsers proactively perform domain name resolution
	 * on both links that the user may choose to follow as well as URLs for items referenced
	 * by the document, including images, CSS, JavaScript, and so forth.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
	 *
	 * https://helmetjs.github.io/docs/dns-prefetch-control/
	 */
	XDNSPrefetchControl: 'x-dns-prefetch-control',

	/**
	 * Links generated code to a source map.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/SourceMap
	 */
	SourceMap: 'sourcemap',

	/**
	 * Tells the browser that the page being loaded is going to want to perform a large allocation.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Large-Allocation
	 */
	LargeAllocation: 'large-allocation',

	/**
	 * Communicates one or more metrics and descriptions for the given request-response cycle.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing
	 */
	ServerTiming: 'server-timing',

	/**
	 * Recommends the preferred rendering engine (often a backward-compatibility mode)
	 * to use to display the content. Also used to activate Chrome Frame in Internet Explorer.
	 *
	 * https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-iedoco/380e2488-f5eb-4457-a07a-0cb1b6e4b4b5
	 */
	XUACompatible: 'x-ua-compatible',

	/**
	 * Used to indicate how a web page is to be indexed within public search engine results.
	 * The header is effectively equivalent to `<meta name="robots" content="...">`.
	 *
	 * https://developers.google.com/search/reference/robots_meta_tag
	 */
	XRobotsTag: 'x-robots-tag',

	//
	// ═════════ Entity Headers ═════════
	//

	/**
	 * Indicates the size of the entity-body, in decimal number of octets, sent to the recipient.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.13
	 */
	ContentLength: 'content-length',

	/**
	 * Indicates the media type of the resource.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17
	 */
	ContentType: 'content-type',

	/**
	 * Used to specify the compression algorithm.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.11
	 */
	ContentEncoding: 'content-encoding',

	/**
	 * Describes the language(s) intended for the audience,
	 * so that it allows a user to differentiate according to the users' own preferred language.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.12
	 */
	ContentLanguage: 'content-language',

	/**
	 * Indicates an alternate location for the returned data.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Location
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.14
	 */
	ContentLocation: 'content-location',

	/**
	 * Indicates where in a full body message a partial message belongs.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.16
	 */
	ContentRange: 'content-range',

	/**
	 * MD5 digest of the entity-body for the purpose of providing
	 * an end-to-end message integrity check (MIC) of the entity-body.
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.15
	 */
	ContentMd5: 'content-md5',

	/**
	 * Lists the set of HTTP request methods support by a resource.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Allow
	 *
	 * https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.7
	 */
	Allow: 'allow',

	/**
	 * Provides a means for serialising one or more links in HTTP headers.
	 * It is semantically equivalent to the HTML `<link>` element.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Link
	 */
	Link: 'link',
}

export type ResponseHeader = typeof ResponseHeader[keyof typeof ResponseHeader]

// ────────────────────────────────────────────────────────────────────────────

/**
 * HTTP headers allow the client and the server to pass additional information with the request or the response.
 * An HTTP header consists of its **case-insensitive** name followed by a colon `:`, then by its value (without line breaks).
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
 *
 * https://en.wikipedia.org/wiki/List_of_HTTP_header_fields
 *
 * @public
 */
export const Header = <const>{
	...RequestHeader,
	...ResponseHeader,
}

export type Header = RequestHeader | ResponseHeader
