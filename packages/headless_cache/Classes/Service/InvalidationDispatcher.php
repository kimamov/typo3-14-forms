<?php

declare(strict_types=1);

namespace Mir\HeadlessCache\Service;

use Psr\Log\LoggerInterface;
use Mir\HeadlessCache\Dto\Invalidation;
use TYPO3\CMS\Core\Configuration\ExtensionConfiguration;
use TYPO3\CMS\Core\Http\RequestFactory;

final readonly class InvalidationDispatcher
{
    public function __construct(
        private RequestFactory $requestFactory,
        private ExtensionConfiguration $extensionConfiguration,
        private LoggerInterface $logger,
    ) {}

    public function dispatch(Invalidation $invalidation): void
    {
        $configuration = $this->extensionConfiguration->get(
            'headless_cache',
        );

        $endpoint = trim((string)($configuration['endpoint'] ?? ''));
        $secret = (string)($configuration['secret'] ?? '');
        $timeout = max(1, (int)($configuration['timeout'] ?? 3));

        if ($endpoint === '' || $secret === '') {
            $this->logger->warning(
                'Headless cache invalidation is not configured.',
            );

            return;
        }

        $payload = json_encode(
            $invalidation->toArray(),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        );

        $timestamp = (string)time();

        $signature = hash_hmac(
            'sha256',
            $timestamp . '.' . $payload,
            $secret,
        );

        try {
            $response = $this->requestFactory->request(
                $endpoint,
                'POST',
                [
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'X-Webhook-Timestamp' => $timestamp,
                        'X-Webhook-Signature' => 'sha256=' . $signature,
                    ],
                    'body' => $payload,
                    'timeout' => $timeout,
                    'connect_timeout' => $timeout,
                    'http_errors' => false,
                ],
            );

            if ($response->getStatusCode() >= 300) {
                $this->logger->error(
                    'Headless cache invalidation returned an error.',
                    [
                        'statusCode' => $response->getStatusCode(),
                        'body' => (string)$response->getBody(),
                    ],
                );
            }
        } catch (\Throwable $exception) {
            /*
             * Never block a TYPO3 editor save merely because the frontend
             * is temporarily unavailable.
             */
            $this->logger->error(
                'Headless cache invalidation request failed.',
                [
                    'exception' => $exception,
                    'invalidation' => $invalidation->toArray(),
                ],
            );
        }
    }
}