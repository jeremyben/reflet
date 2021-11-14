/**
 * Headers containing more information about the resource to be fetched or about the client itself.
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Request_header
 * @public
 */
export const RequestHeader = {
	//
	// ═════════ CORS Request Headers ═════════
	//
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_request_headers

	/**
	 * Used when issuing a preflight request to let the server know which HTTP headers will be used
	 * when the actual request is made.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers)
	 */
	AccessControlRequestHeaders: <const>'access-control-request-headers',

	/**
	 * Used when issuing a preflight request to let the server know which HTTP method will be used
	 * when the actual request is made.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method)
	 */
	AccessControlRequestMethod: <const>'access-control-request-method',

	/**
	 * Indicates where a fetch originates from.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin)
	 */
	Origin: <const>'origin',

	//
	// ═════════ Authentication ═════════
	//

	/**
	 * Contains the credentials to authenticate a user agent with a server.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.8)
	 */
	Authorization: <const>'authorization',

	/**
	 * Contains the credentials to authenticate a user agent with a proxy server.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authorization)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.34)
	 */
	ProxyAuthorization: <const>'proxy-authorization',

	//
	// ═════════ Content negotiation ═════════
	//
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation

	/**
	 * Informs the server about the types of data that can be sent back. It is MIME-type.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1)
	 */
	Accept: <const>'accept',

	/**
	 * Informs the server about which character set the client is able to understand.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Charset)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.2)
	 */
	AcceptCharset: <const>'accept-charset',

	/**
	 * Informs the server about the encoding algorithm, usually a compression algorithm,
	 * that can be used on the resource sent back.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3)
	 */
	AcceptEncoding: <const>'accept-encoding',

	/**
	 * Informs the server about the language the server is expected to send back.
	 * This is a hint and is not necessarily under the full control of the user:
	 * the server should always pay attention not to override an explicit user choice
	 * (like selecting a language in a drop down list).
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.4)
	 */
	AcceptLanguage: <const>'accept-language',

	//
	// ═════════ Caching ═════════
	//

	// General header
	/**
	 * Specifies directives for caching mechanisms in both requests and responses.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9)
	 */
	CacheControl: <const>'cache-control',

	// General header
	/**
	 * Implementation-specific header that may have various effects anywhere along the request-response chain.
	 * Used for backwards compatibility with HTTP/1.0 caches where the `Cache-Control` header is not yet present.
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.32)
	 */
	Pragma: <const>'pragma',

	//
	// ═════════ Transfer coding ═════════
	//

	/**
	 * Specifies the transfer encodings the user agent is willing to accept.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/TE)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.39)
	 */
	TE: <const>'te',

	//
	// ═════════ Request context ═════════
	//

	/**
	 * Contains an Internet email address for a human user who controls the requesting user agent.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/From)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.22)
	 */
	From: <const>'from',

	/**
	 * Specifies the domain name of the server (for virtual hosting), and (optionally) the TCP port number on which the server is listening.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Host)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.23)
	 */
	Host: <const>'host',

	/**
	 * The address of the previous web page from which a link to the currently requested page was followed.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.36)
	 */
	Referer: <const>'referer',

	/**
	 * Contains a characteristic string that allows the network protocol peers to identify
	 * the application type, operating system, software vendor or software version
	 * of the requesting software user agent.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.43)
	 */
	UserAgent: <const>'user-agent',

	//
	// ═════════ Controls ═════════
	//

	/**
	 * Indicates expectations that need to be fulfilled by the server in order to properly handle the request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.20)
	 */
	Expect: <const>'expect',

	/**
	 * Provides a mechanism with the `TRACE` and `OPTIONS` methods to limit the number
	 * of proxies or gateways that can forward the request to the next inbound server.
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.31)
	 */
	MaxForwards: <const>'max-forwards',

	//
	// ═════════ Proxies ═════════
	//

	/**
	 * Contains information from the client-facing side of proxy servers
	 * that is altered or lost when a proxy is involved in the path of the request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded)
	 */
	Forwarded: <const>'forwarded',

	/**
	 * Identifies the originating IP addresses of a client connecting to a web server
	 * through an HTTP proxy or a load balancer.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)
	 */
	XForwardedFor: <const>'x-forwarded-for',

	/**
	 * Identifies the original host requested that a client used to connect to your proxy or load balancer.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host)
	 */
	XForwardedHost: <const>'x-forwarded-host',

	/**
	 * Identifies the protocol (HTTP or HTTPS) that a client used to connect to your proxy or load balancer.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto)
	 */
	XForwardedProto: <const>'x-forwarded-proto',

	// General header
	/**
	 * Added by proxies, both forward and reverse proxies, and can appear in the request headers and the response headers.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Via)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.45)
	 */
	Via: <const>'via',

	//
	// ═════════ Conditionals ═════════
	//

	/**
	 * Makes the request conditional and applies the method only if the stored resource matches one of the given ETags.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match)
	 */
	IfMatch: <const>'if-match',

	/**
	 * Makes the request conditional and applies the method only if the stored resource doesn't match any of the given ETags.
	 *
	 * This is used to update caches (for safe requests), or to prevent to upload a new resource when one is already existing.
	 *
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match)
	 */
	IfNoneMatch: <const>'if-none-match',

	/**
	 * Makes the request conditional and expects the entity to be transmitted only if it has been modified after the given date.
	 *
	 * This is used to transmit data only when the cache is out of date.
	 *
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
	 */
	IfModifiedSince: <const>'if-modified-since',

	/**
	 * Makes the request conditional and expects the entity to be transmitted only if it has not been modified after the given date.
	 *
	 * This is used to ensure the coherence of a new fragment of a specific range with previous ones,
	 * or to implement an optimistic concurrency control system when modifying existing documents.
	 *
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Unmodified-Since)
	 */
	IfUnmodifiedSince: <const>'if-unmodified-since',

	//
	// ═════════ Range requests ═════════
	//

	/**
	 * Indicates the part of a document that the server should return.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35)
	 */
	Range: <const>'range',

	/**
	 * Creates a conditional range request that is only fulfilled if the given etag or date matches the remote resource.
	 * Used to prevent downloading two ranges from incompatible version of the resource.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Range)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.27)
	 */
	IfRange: <const>'if-range',

	//
	// ═════════ Cookies ═════════
	//

	/**
	 * Contains stored HTTP cookies previously sent by the server with the `Set-Cookie` header.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cookie)
	 */
	Cookie: <const>'cookie',

	//
	// ═════════ Do Not Track ═════════
	//

	/**
	 * Used for expressing the user's tracking preference.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/DNT)
	 */
	DNT: <const>'dnt',

	//
	// ═════════ Connection management ═════════
	//

	// General header
	/**
	 * Controls whether the network connection stays open after the current transaction finishes.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.10)
	 */
	Connection: <const>'connection',

	// General header
	/**
	 *
	 * Controls how long a persistent connection should stay open.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive)
	 *
	 */
	KeepAlive: <const>'keep-alive',

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
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)
	 */
	ContentDisposition: <const>'content-disposition',

	//
	// ═════════ Security ═════════
	//

	/**
	 * Sends a signal to the server expressing the client’s preference for an encrypted and authenticated response,
	 * and that it can successfully handle the `upgrade-insecure-requests` directive.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade-Insecure-Requests)
	 */
	UpgradeInsecureRequests: <const>'upgrade-insecure-requests',

	/**
	 * Mainly used to identify Ajax requests. Most JavaScript frameworks send this field with value of XMLHttpRequest.
	 */
	XRequestedWith: <const>'x-requested-with',

	/**
	 * Used to prevent cross-site request forgery.
	 *
	 * https://en.wikipedia.org/wiki/Cross-site_request_forgery#Cookie-to-header_token
	 */
	XCSRFToken: <const>'x-csrf-token',

	//
	// ═════════ Client Hints ═════════
	//

	/**
	 * Indicates the user agent's preference for reduced data usage.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Save-Data)
	 */
	SaveData: <const>'save-data',

	//
	// ═════════ Other ═════════
	//

	// General header
	/**
	 * A general warning field containing information about possible problems.
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Warning)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.46)
	 */
	Warning: <const>'warning',

	// General header
	/**
	 * Contains the date and time at which the message was originated.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Date)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18)
	 */
	Date: <const>'date',

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
	Upgrade: <const>'upgrade',

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
	XHttpMethodOverride: <const>'x-http-method-override',

	/**
	 * Connection-specific header field that includes parameters that govern the HTTP/2 connection,
	 * provided in anticipation of the server accepting the request to upgrade from HTTP/1.1 to HTTP/2.
	 *
	 * https://httpwg.org/specs/rfc7540.html#Http2SettingsHeader
	 */
	Http2Settings: <const>'http2-settings',

	//
	// ═════════ Entity Headers ═════════
	//

	/**
	 * Indicates the size of the entity-body, in decimal number of octets, sent to the recipient.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.13)
	 */
	ContentLength: <const>'content-length',

	/**
	 * Indicates the media type of the resource.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17)
	 */
	ContentType: <const>'content-type',

	/**
	 * MD5 digest of the entity-body for the purpose of providing
	 * an end-to-end message integrity check (MIC) of the entity-body.
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.15)
	 */
	ContentMd5: <const>'content-md5',
}

export type RequestHeader = typeof RequestHeader[keyof typeof RequestHeader]

// ────────────────────────────────────────────────────────────────────────────

/**
 * Headers with additional information about the response, like its location or about the server itself (name and version, etc).
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Response_header
 * @public
 */
export const ResponseHeader = {
	//
	// ═════════ CORS Response Headers ═════════
	//
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers

	/**
	 * Indicates whether the response can be shared.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
	 */
	AccessControlAllowOrigin: <const>'access-control-allow-origin',

	/**
	 * Indicates whether the response to the request can be exposed when the credentials flag is true.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials)
	 */
	AccessControlAllowCredentials: <const>'access-control-allow-credentials',

	/**
	 * Used in response to a preflight request to indicate which HTTP headers can be used when making the actual request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
	 */
	AccessControlAllowHeaders: <const>'access-control-allow-headers',

	/**
	 * Specifies the method or methods allowed when accessing the resource in response to a preflight request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods)
	 */
	AccessControlAllowMethods: <const>'access-control-allow-methods',

	/**
	 * Indicates which headers can be exposed as part of the response by listing their names.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers)
	 */
	AccessControlExposeHeaders: <const>'access-control-expose-headers',

	/**
	 * Indicates how long the results of a preflight request can be cached.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age)
	 */
	AccessControlMaxAge: <const>'access-control-max-age',

	/**
	 * Used to remove the path restriction by including this header in the response of the serviceworker script.
	 *
	 * https://w3c.github.io/ServiceWorker/#path-restriction
	 *
	 * https://w3c.github.io/ServiceWorker/#service-worker-allowed
	 */
	ServiceWorkerAllowed: <const>'service-worker-allowed',

	/**
	 * Specifies origins that are allowed to see values of attributes retrieved via features of the Resource Timing API,
	 * which would otherwise be reported as zero due to cross-origin restrictions.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin)
	 */
	TimingAllowOrigin: <const>'timing-allow-origin',

	/**
	 * Specifies if a cross-domain policy file (crossdomain.xml) is allowed. The file may define a policy to grant web clients,
	 * such as Adobe's Flash Player, Adobe Acrobat (PDF Reader), Microsoft Silverlight and Apache Flex,
	 * permission to handle data across domains that would otherwise be restricted due to the Same-Origin Policy.
	 *
	 * https://www.adobe.com/devnet/articles/crossdomain_policy_file_spec.html
	 *
	 * https://helmetjs.github.io/docs/crossdomain/
	 */
	XPermittedCrossDomainPolicies: <const>'x-permitted-cross-domain-policies',

	//
	// ═════════ Authentication ═════════
	//

	/**
	 * Defines the authentication method that should be used to gain access to a resource.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.47)
	 */
	WwwAuthenticate: <const>'www-authenticate',

	/**
	 * Defines the authentication method that should be used to gain access to a resource behind a Proxy server.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Proxy-Authenticate)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.33)
	 */
	ProxyAuthenticate: <const>'proxy-authenticate',

	//
	// ═════════ Caching ═════════
	//

	// General header
	/**
	 * Specifies directives for caching mechanisms in both requests and responses.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9)
	 */
	CacheControl: <const>'cache-control',

	// General header
	/**
	 * Implementation-specific header that may have various effects anywhere along the request-response chain.
	 * Used for backwards compatibility with HTTP/1.0 caches where the `Cache-Control` header is not yet present.
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.32)
	 */
	Pragma: <const>'pragma',

	/**
	 * The time in seconds the object has been in a proxy cache.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Age)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17)
	 */
	Age: <const>'age',

	/**
	 * Clears browsing data (e.g. cookies, storage, cache) associated with the requesting website.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data)
	 */
	ClearSiteData: <const>'clear-site-data',

	// entity header ?
	/**
	 * The date/time after which the response is considered stale.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.21)
	 */
	Expires: <const>'expires',

	//
	// ═════════ Request context ═════════
	//

	/**
	 * Governs which referrer information sent in the `Referer` header should be included with requests made.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
	 *
	 * https://helmetjs.github.io/docs/referrer-policy/
	 */
	ReferrerPolicy: <const>'referrer-policy',

	//
	// ═════════ Response context ═════════
	//

	/**
	 * Contains information about the software used by the origin server to handle the request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.38)
	 */
	Server: <const>'server',

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
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)
	 */
	ContentDisposition: <const>'content-disposition',

	//
	// ═════════ Redirects ═════════
	//

	/**
	 * Indicates the URL to redirect a page to.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
	 */
	Location: <const>'location',

	//
	// ═════════ Proxies ═════════
	//

	// General header
	/**
	 * Added by proxies, both forward and reverse proxies, and can appear in the request headers and the response headers.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Via)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.45)
	 */
	Via: <const>'via',

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
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.29)
	 */
	LastModified: <const>'last-modified',

	/**
	 * It is a validator, a unique string identifying the version of the resource.
	 * Conditional requests using `If-Match` and `If-None-Match` use this value to change the behavior of the request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.19)
	 */
	ETag: <const>'etag',

	/**
	 * Determines how to match future request headers to decide whether a cached response can be used
	 * rather than requesting a fresh one from the origin server.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)
	 */
	Vary: <const>'vary',

	//
	// ═════════ Range requests ═════════
	//

	/**
	 * Indicates if the server supports range requests, and if so in which unit the range can be expressed.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Ranges)
	 */
	AcceptRanges: <const>'accept-ranges',

	//
	// ═════════ Transfer coding ═════════
	//

	// General header
	/**
	 * Specifies the form of encoding used to safely transfer the entity to the user.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.41)
	 */
	TransferEncoding: <const>'transfer-encoding',

	// General header
	/**
	 * Allows the sender to include additional fields at the end of chunked message.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Trailer)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.40)
	 */
	Trailer: <const>'trailer',

	//
	// ═════════ Cookies ═════════
	//

	/**
	 * Send cookies from the server to the user agent.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
	 */
	SetCookie: <const>'set-cookie',

	//
	// ═════════ Do Not Track ═════════
	//

	/**
	 * Indicates the tracking status that applied to the corresponding request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Tk)
	 */
	Tk: <const>'tk',

	//
	// ═════════ Connection management ═════════
	//

	// General header
	/**
	 * Controls whether the network connection stays open after the current transaction finishes.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.10)
	 */
	Connection: <const>'connection',

	// General header
	/**
	 *
	 * Controls how long a persistent connection should stay open.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive)
	 *
	 */
	KeepAlive: <const>'keep-alive',

	//
	// ═════════ Security ═════════
	//

	/**
	 * Prevents other domains from opening/controlling a window.
	 * (COOP)
	 *
	 * https://www.chromestatus.com/feature/5432089535053824
	 */
	CrossOriginOpenerPolicy: <const>'cross-origin-opener-policy',

	/**
	 * Prevents other domains from reading the response of the resources to which this header is applied.
	 * (CORP)
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy)
	 */
	CrossOriginResourcePolicy: <const>'cross-origin-resource-policy',

	/**
	 * Controls resources the user agent is allowed to load for a given page.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
	 *
	 * https://helmetjs.github.io/docs/csp/
	 */
	ContentSecurityPolicy: <const>'content-security-policy',

	/**
	 * Allows web developers to experiment with policies by monitoring, but not enforcing, their effects.
	 * These violation reports consist of JSON documents sent via an HTTP POST request to the specified URI.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only)
	 */
	ContentSecurityPolicyReportOnly: <const>'content-security-policy-report-only',

	/**
	 * Allows sites to opt in to reporting and/or enforcement of Certificate Transparency requirements,
	 * which prevents the use of misissued certificates for that site from going unnoticed.
	 * When a site enables the `Expect-CT` header, they are requesting that Chrome check
	 * that any certificate for that site appears in public CT logs.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect-CT)
	 *
	 * https://helmetjs.github.io/docs/expect-ct/
	 */
	ExpectCT: <const>'expect-ct',

	/**
	 * Provides a mechanism to allow and deny the use of browser features in its own frame,
	 * and in iframes that it embeds.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy)
	 *
	 * https://helmetjs.github.io/docs/feature-policy/
	 */
	FeaturePolicy: <const>'feature-policy',

	/**
	 * Associates a specific cryptographic public key with a certain web server to decrease
	 * the risk of {@link https://developer.mozilla.org/en-US/docs/Glossary/MITM | MITM} attacks with forged certificates.
	 * (HPKP)
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Public-Key-Pins)
	 */
	PublicKeyPins: <const>'public-key-pins',

	/**
	 * Sends reports to the report-uri specified in the header and does still allow clients
	 * to connect to the server even if the pinning is violated.
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Public-Key-Pins-Report-Only)
	 */
	PublicKeyPinsReportOnly: <const>'public-key-pins-report-only',

	/**
	 * Force communication using HTTPS instead of HTTP.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
	 *
	 * https://helmetjs.github.io/docs/hsts/
	 */
	StrictTransportSecurity: <const>'strict-transport-security',

	/**
	 * Disables MIME sniffing and forces browser to use the type given in `Content-Type`.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
	 *
	 * https://helmetjs.github.io/docs/dont-sniff-mimetype/
	 */
	XContentTypeOptions: <const>'x-content-type-options',

	/**
	 * Indicates that the browser (Internet Explorer) should not display the option
	 * to "Open" a file that has been downloaded from an application, to prevent phishing attacks
	 * as the file otherwise would gain access to execute in the context of the application.
	 * @deprecated
	 *
	 * https://helmetjs.github.io/docs/ienoopen/
	 */
	XDownloadOptions: <const>'x-download-options',

	/**
	 * Indicates whether a browser should be allowed to render a page in a `<frame>,` `<iframe>`, `<embed>` or `<object>`.
	 * (XFO)
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
	 *
	 * https://helmetjs.github.io/docs/frameguard/
	 */
	XFrameOptions: <const>'x-frame-options',

	/**
	 * May be set by hosting environments or other frameworks and contains information
	 * about them while not providing any usefulness to the application or its visitors.
	 * Unset this header to avoid exposing potential vulnerabilities.
	 *
	 * https://helmetjs.github.io/docs/hide-powered-by/
	 */
	XPoweredBy: <const>'x-powered-by',

	/**
	 * Enables cross-site scripting filtering.
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection)
	 *
	 * https://helmetjs.github.io/docs/xss-filter/
	 */
	XXSSProtection: <const>'x-xss-protection',

	//
	// ═════════ Other ═════════
	//

	// General header
	/**
	 * A general warning field containing information about possible problems.
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Warning)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.46)
	 */
	Warning: <const>'warning',

	// General header
	/**
	 * Contains the date and time at which the message was originated.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Date)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18)
	 */
	Date: <const>'date',

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
	Upgrade: <const>'upgrade',

	/**
	 * Specifies the patch document formats accepted by the server.
	 *
	 * Its presence in response to any method is an implicit indication
	 * that `PATCH` is allowed on the resource identified by the Request-URI.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Patch)
	 */
	AcceptPatch: <const>'accept-patch',

	/**
	 * Used to list alternate ways to reach this service.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Alt-Svc)
	 */
	AltSvc: <const>'alt-svc',

	/**
	 * Indicates how long the user agent should wait before making a follow-up request.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.37)
	 */
	RetryAfter: <const>'retry-after',

	/**
	 * Controls DNS prefetching, a feature by which browsers proactively perform domain name resolution
	 * on both links that the user may choose to follow as well as URLs for items referenced
	 * by the document, including images, CSS, JavaScript, and so forth.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control)
	 *
	 * https://helmetjs.github.io/docs/dns-prefetch-control/
	 */
	XDNSPrefetchControl: <const>'x-dns-prefetch-control',

	/**
	 * Links generated code to a source map.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/SourceMap)
	 */
	SourceMap: <const>'sourcemap',

	/**
	 * Tells the browser that the page being loaded is going to want to perform a large allocation.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Large-Allocation)
	 */
	LargeAllocation: <const>'large-allocation',

	/**
	 * Communicates one or more metrics and descriptions for the given request-response cycle.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
	 */
	ServerTiming: <const>'server-timing',

	/**
	 * Recommends the preferred rendering engine (often a backward-compatibility mode)
	 * to use to display the content. Also used to activate Chrome Frame in Internet Explorer.
	 *
	 * https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-iedoco/380e2488-f5eb-4457-a07a-0cb1b6e4b4b5
	 */
	XUACompatible: <const>'x-ua-compatible',

	/**
	 * Used to indicate how a web page is to be indexed within public search engine results.
	 * The header is effectively equivalent to `<meta name="robots" content="...">`.
	 *
	 * [MDN Reference](https://developers.google.com/search/reference/robots_meta_tag)
	 */
	XRobotsTag: <const>'x-robots-tag',

	//
	// ═════════ Entity Headers ═════════
	//

	/**
	 * Indicates the size of the entity-body, in decimal number of octets, sent to the recipient.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.13)
	 */
	ContentLength: <const>'content-length',

	/**
	 * Indicates the media type of the resource.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17)
	 */
	ContentType: <const>'content-type',

	/**
	 * Used to specify the compression algorithm.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.11)
	 */
	ContentEncoding: <const>'content-encoding',

	/**
	 * Describes the language(s) intended for the audience,
	 * so that it allows a user to differentiate according to the users' own preferred language.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Language)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.12)
	 */
	ContentLanguage: <const>'content-language',

	/**
	 * Indicates an alternate location for the returned data.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Location)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.14)
	 */
	ContentLocation: <const>'content-location',

	/**
	 * Indicates where in a full body message a partial message belongs.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.16)
	 */
	ContentRange: <const>'content-range',

	/**
	 * MD5 digest of the entity-body for the purpose of providing
	 * an end-to-end message integrity check (MIC) of the entity-body.
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.15)
	 */
	ContentMd5: <const>'content-md5',

	/**
	 * Lists the set of HTTP request methods support by a resource.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Allow)
	 *
	 * [W3C Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.7)
	 */
	Allow: <const>'allow',

	/**
	 * Provides a means for serialising one or more links in HTTP headers.
	 * It is semantically equivalent to the HTML `<link>` element.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Link)
	 */
	Link: <const>'link',
}

export type ResponseHeader = typeof ResponseHeader[keyof typeof ResponseHeader]
