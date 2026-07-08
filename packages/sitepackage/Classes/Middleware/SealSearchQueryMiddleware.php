<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Copies tx_seal_search arguments from the query string into the request body
 * so the seal SearchController can read the search term from parsedBody while
 * the global search bar can submit using a plain GET form.
 */
final class SealSearchQueryMiddleware implements MiddlewareInterface
{
    private const PLUGIN_NAMESPACE = 'tx_seal_search';

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if ($request->getMethod() !== 'GET') {
            return $handler->handle($request);
        }

        $queryParams = $request->getQueryParams();
        $sealSearch = $queryParams[self::PLUGIN_NAMESPACE] ?? null;
        if (!is_array($sealSearch) || $sealSearch === []) {
            return $handler->handle($request);
        }

        $parsedBody = $request->getParsedBody() ?? [];
        if (!is_array($parsedBody)) {
            $parsedBody = [];
        }

        $parsedBody[self::PLUGIN_NAMESPACE] = array_merge(
            $parsedBody[self::PLUGIN_NAMESPACE] ?? [],
            $sealSearch,
        );

        return $handler->handle($request->withParsedBody($parsedBody));
    }
}
