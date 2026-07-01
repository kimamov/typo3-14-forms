<?php
require_once 'vendor/autoload.php';

$container = \TYPO3\CMS\Core\Utility\GeneralUtility::getContainer();
$builder = $container->get(\Lochmueller\Index\Indexing\Frontend\FrontendRequestBuilder::class);

$urls = [
    'https://t3-forms.ddev.site/events/meetup/First%20Skynet%20Event',
    'https://t3-forms.ddev.site/events',
];

foreach ($urls as $url) {
    $content = $builder->buildRequestForPage(new \TYPO3\CMS\Core\Http\Uri($url));
    preg_match('/<title\b[^>]*>([\s\S]*?)<\/title>/i', $content ?? '', $matches);
    echo "URL: $url\n";
    echo "Title: " . trim(html_entity_decode($matches[1] ?? 'NO TITLE', ENT_QUOTES | ENT_HTML5, 'UTF-8')) . "\n";
    echo "Length: " . strlen($content ?? '') . "\n";
    echo "---\n";
}
