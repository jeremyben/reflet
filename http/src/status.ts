/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Information_responses
 *
 * @public
 */
export const InformationStatus = <const>{
	/**
	 * This interim response indicates that everything so far is OK
	 * and that the client should continue with the request or ignore it if it is already finished.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100
	 */
	Continue: 100,

	/**
	 * This code is sent in response to an `Upgrade` request header by the client,
	 * and indicates the protocol the server is switching to.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101
	 */
	SwitchingProtocols: 101,

	/**
	 * This code indicates that the server has received and is processing the request,
	 * but no response is available yet.
	 */
	Processing: 102,

	/**
	 * This status code is primarily intended to be used with the `Link` header to allow
	 * the user agent to start preloading resources while the server is still preparing a response.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103
	 */
	EarlyHints: 103,
}

export type InformationStatus = typeof InformationStatus[keyof typeof InformationStatus]

// ────────────────────────────────────────────────────────────────────────────

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Successful_responses
 *
 * @public
 */
export const SuccessStatus = <const>{
	/**
	 * The request has succeeded.
	 * The meaning of a success varies depending on the HTTP method:
	 *
	 * - `GET`: The resource has been fetched and is transmitted in the message body.
	 * - `HEAD`: The entity headers are in the message body.
	 * - `PUT` or `POST`: The resource describing the result of the action is transmitted in the message body.
	 * - `TRACE`: The message body contains the request message as received by the server
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200
	 */
	Ok: 200,

	/**
	 * The request has succeeded and a new resource has been created as a result of it.
	 * This is typically the response sent after a `POST` request, or after some `PUT` requests.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201
	 */
	Created: 201,

	/**
	 * The request has been received but not yet acted upon. It is non-committal,
	 * meaning that there is no way in HTTP to later send an asynchronous response
	 * indicating the outcome of processing the request.
	 *
	 * It is intended for cases where another process or server handles the request, or for batch processing.
	 */
	Accepted: 202,

	/**
	 * This response code means returned meta-information set is not exact set as available
	 * from the origin server, but collected from a local or a third party copy.
	 *
	 * Except this condition, `200 OK` response should be preferred instead of this response.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203
	 */
	NonAuthoritativeInformation: 203,

	/**
	 * There is no content to send for this request, but the headers may be useful.
	 * The user-agent may update its cached headers for this resource with the new ones.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204
	 */
	NoContent: 204,

	/**
	 * This response code is sent after accomplishing request to tell user agent reset document view which sent this request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/205
	 */
	ResetContent: 205,

	/**
	 * This response code is used because of range header sent by the client to separate download into multiple streams.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
	 */
	PartialContent: 206,

	/**
	 * Conveys information about multiple resources in situations
	 * where multiple status codes might be appropriate.
	 */
	MultiStatus: 207,

	/**
	 * Used inside a DAV: propstat response element to avoid enumerating
	 * the internal members of multiple bindings to the same collection repeatedly.
	 */
	AlreadyReported: 208,

	/**
	 * The server has fulfilled a `GET` request for the resource, and the response is a representation
	 * of the result of one or more instance-manipulations applied to the current instance.
	 */
	ImUsed: 226,
}

export type SuccessStatus = typeof SuccessStatus[keyof typeof SuccessStatus]

// ────────────────────────────────────────────────────────────────────────────

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Redirection_messages
 *
 * @public
 */
export const RedirectionStatus = <const>{
	/**
	 * The request has more than one possible response. The user-agent or user should choose one of them.
	 * There is no standardized way of choosing one of the responses.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300
	 */
	MultipleChoices: 300,

	/**
	 * This response code means that the URI of the requested resource has been changed permanently.
	 * Probably, the new URI would be given in the response.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301
	 */
	MovedPermanently: 301,

	/**
	 * This response code means that the URI of requested resource has been changed _temporarily_.
	 * New changes in the URI might be made in the future.
	 *
	 * Therefore, this same URI should be used by the client in future requests.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302
	 */
	Found: 302,

	/**
	 * The server sent this response to direct the client to get the requested resource at another URI with a `GET` request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303
	 */
	SeeOther: 303,

	/**
	 * This is used for caching purposes. It tells the client that the response has not been modified,
	 * so the client can continue to use the same cached version of the response.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304
	 */
	NotModified: 304,

	/**
	 * The server sends this response to direct the client to get the requested resource at another URI
	 * with same method that was used in the prior request.
	 *
	 * This has the same semantics as the `302 Found` HTTP response code,
	 * with the exception that the user agent must not change the HTTP method used:
	 * If a `POST` was used in the first request, a `POST` must be used in the second request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307
	 */
	TemporaryRedirect: 307,

	/**
	 * This means that the resource is now permanently located at another URI,
	 * specified by the `Location` HTTP Response header.
	 *
	 * This has the same semantics as the `301 Moved Permanently` HTTP response code,
	 * with the exception that the user agent must not change the HTTP method used:
	 * If a `POST` was used in the first request, a `POST` must be used in the second request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308
	 */
	PermanentRedirect: 308,
}

export type RedirectionStatus = typeof RedirectionStatus[keyof typeof RedirectionStatus]

// ────────────────────────────────────────────────────────────────────────────

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses
 *
 * @public
 */
export const ClientErrorStatus = <const>{
	/**
	 * This response means that server could not understand the request due to invalid syntax.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
	 */
	BadRequest: 400,

	/**
	 * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated".
	 * That is, the client must authenticate itself to get the requested response.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
	 */
	Unauthorized: 401,

	/**
	 * This response code is reserved for future use.
	 * Initial aim for creating this code was using it for digital payment systems,
	 * however this status code is used very rarely and no standard convention exists.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402
	 */
	PaymentRequired: 402,

	/**
	 * The client does not have access rights to the content, i.e. they are _unauthorized_,
	 * so server is rejecting to give proper response.
	 *
	 * Unlike `401`, the client's identity is known to the server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
	 */
	Forbidden: 403,

	/**
	 * The server can not find requested resource. In the browser, this means the URL is not recognized.
	 * In an API, this can also mean that the endpoint is valid but the resource itself does not exist.
	 *
	 * Servers may also send this response instead of `403` to hide the existence of a resource from an unauthorized client.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
	 */
	NotFound: 404,

	/**
	 * The request method is known by the server but has been disabled and cannot be used.
	 * For example, an API may forbid `DELETE`-ing a resource.
	 *
	 * The two mandatory methods, `GET` and `HEAD`, must never be disabled and should not return this error code.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
	 */
	MethodNotAllowed: 405,

	/**
	 * This response is sent when the web server, after performing server-driven content negotiation,
	 * doesn't find any content following the criteria given by the user agent.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406
	 */
	NotAcceptable: 406,

	/**
	 * This is similar to `401` but authentication is needed to be done by a proxy.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/40
	 */
	ProxyAuthenticationRequired: 407,

	/**
	 * This response is sent on an idle connection by some servers, even without any previous request by the client.
	 * It means that the server would like to shut down this unused connection.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408
	 */
	RequestTimeout: 408,

	/**
	 * This response is sent when a request conflicts with the current state of the server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
	 */
	Conflict: 409,

	/**
	 * This response would be sent when the requested content has been permanently deleted from server, with no forwarding address.
	 * Clients are expected to remove their caches and links to the resource.
	 *
	 * The HTTP specification intends this status code to be used for "limited-time, promotional services".
	 * APIs should not feel compelled to indicate resources that have been deleted with this status code.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410
	 */
	Gone: 410,

	/**
	 * Server rejected the request because the `Content-Length` header field is not defined and the server requires it.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411
	 */
	LengthRequired: 411,

	/**
	 * The client has indicated preconditions in its headers which the server does not meet.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412
	 */
	PreconditionFailed: 412,

	/**
	 * Request entity is larger than limits defined by server.
	 * The server might close the connection or return an `Retry-After` header field.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413
	 */
	PayloadTooLarge: 413,

	/**
	 * The URI requested by the client is longer than the server is willing to interpret.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414
	 */
	UriTooLong: 414,

	/**
	 * The media format of the requested data is not supported by the server, so the server is rejecting the request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415
	 */
	UnsupportedMediaType: 415,

	/**
	 * The range specified by the `Range` header field in the request can't be fulfilled.
	 * It's possible that the range is outside the size of the target URI's data.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416
	 */
	RequestedRangeNotSatisfiable: 416,

	/**
	 * This response code means the expectation indicated by the `Expect` request header field can't be met by the server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417
	 */
	ExpectationFailed: 417,

	/**
	 * The server refuses the attempt to brew coffee with a teapot.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
	 */
	ImATeapot: 418,

	/**
	 * The request was directed at a server that is not able to produce a response.
	 * This can be sent by a server that is not configured to produce responses
	 * for the combination of scheme and authority that are included in the request URI.
	 */
	MisdirectedRequest: 421,

	/**
	 * The request was well-formed but was unable to be followed due to semantic errors.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
	 */
	UnprocessableEntity: 422,

	/**
	 * The resource that is being accessed is locked.
	 */
	Locked: 423,

	/**
	 * The request failed due to failure of a previous request.
	 */
	FailedDependency: 424,

	/**
	 * Indicates that the server is unwilling to risk processing a request that might be replayed.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425
	 */
	TooEarly: 425,

	/**
	 * The server refuses to perform the request using the current protocol
	 * but might be willing to do so after the client upgrades to a different protocol.
	 * The server sends an `Upgrade` header in a 426 response to indicate the required protocol(s).
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426
	 */
	UpgradeRequired: 426,

	/**
	 * The origin server requires the request to be conditional.
	 * Intended to prevent the 'lost update' problem, where a client GETs a resource's state,
	 * modifies it, and PUTs it back to the server, when meanwhile a third party has modified
	 * the state on the server, leading to a conflict.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428
	 */
	PreconditionRequired: 428,

	/**
	 * The user has sent too many requests in a given amount of time ("rate limiting").
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
	 */
	TooManyRequests: 429,

	/**
	 * The server is unwilling to process the request because its header fields are too large.
	 * The request MAY be resubmitted after reducing the size of the request header fields.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431
	 */
	RequestHeaderFieldsTooLarge: 431,

	/**
	 * The user requests an illegal resource, such as a web page censored by a government.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451
	 */
	UnavailableForLegalReasons: 451,
}

export type ClientErrorStatus = typeof ClientErrorStatus[keyof typeof ClientErrorStatus]

// ────────────────────────────────────────────────────────────────────────────

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Server_error_responses
 *
 * @public
 */
export const ServerErrorStatus = <const>{
	/**
	 * The server has encountered a situation it doesn't know how to handle.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
	 */
	InternalServerError: 500,

	/**
	 * The request method is not supported by the server and cannot be handled.
	 * The only methods that servers are required to support (and therefore that must not return this code) are `GET` and `HEAD`.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501
	 */
	NotImplemented: 501,

	/**
	 * This error response means that the server, while working as a gateway
	 * to get a response needed to handle the request, got an invalid response.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502
	 */
	BadGateway: 502,

	/**
	 * The server is not ready to handle the request. Common causes are a server that is down for maintenance or that is overloaded.
	 *
	 * Note that together with this response, a user-friendly page explaining the problem should be sent.
	 * This responses should be used for temporary conditions and the `Retry-After` HTTP header should, if possible,
	 * contain the estimated time before the recovery of the service.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
	 */
	ServiceUnavailable: 503,

	/**
	 * This error response is given when the server is acting as a gateway and cannot get a response in time.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504
	 */
	GatewayTimeout: 504,

	/**
	 * The HTTP version used in the request is not supported by the server.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505
	 */
	HttpVersionNotSupported: 505,

	/**
	 * The server has an internal configuration error: the chosen variant resource
	 * is configured to engage in transparent content negotiation itself,
	 * and is therefore not a proper end point in the negotiation process.
	 */
	VariantAlsoNegotiates: 506,

	/**
	 * The method could not be performed on the resource because the server is unable
	 * to store the representation needed to successfully complete the request.
	 */
	InsufficientStorage: 507,

	/**
	 * The server detected an infinite loop while processing the request.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
	 */
	LoopDetected: 508,

	/**
	 * Further extensions to the request are required for the server to fulfil it.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510
	 */
	NotExtended: 510,

	/**
	 * Indicates that the client needs to authenticate to gain network access.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511
	 */
	NetworkAuthenticationRequired: 511,
}

export type ServerErrorStatus = typeof ServerErrorStatus[keyof typeof ServerErrorStatus]

// ────────────────────────────────────────────────────────────────────────────

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Client_error_responses

 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#Server_error_responses
 *
 * @public
 */
export const ErrorStatus = <const>{
	...ClientErrorStatus,
	...ServerErrorStatus,
}

export type ErrorStatus = ClientErrorStatus | ServerErrorStatus

// ────────────────────────────────────────────────────────────────────────────

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *
 * @enum
 * @public
 */
export const Status = <const>{
	...InformationStatus,
	...SuccessStatus,
	...RedirectionStatus,
	...ErrorStatus,
}

export type Status = InformationStatus | SuccessStatus | RedirectionStatus | ErrorStatus

// export namespace Status {
// 	export type Information = InformationStatus
// 	export type Success = SuccessStatus
// 	export type Redirection = RedirectionStatus
// 	export type Error = ErrorStatus
// }
