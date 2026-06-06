<?php
/**
 * Copiar para brevo-smtp-config.php no servidor (não versionar a chave SMTP).
 * Caminho: /usr/local/share/wordpress-mu-plugins/brevo-smtp-config.php
 */
return [
    'host' => 'smtp-relay.brevo.com',
    'port' => 587,
    'secure' => 'tls',
    'user' => 'seu_login@smtp-brevo.com',
    'pass' => 'CHAVE_SMTP_BREVO',
    'from_by_domain' => [
        'oshercollective.com' => [
            'email' => 'geral@oshercollective.com',
            'name' => 'Osher Collective',
        ],
        'aamihe.com' => [
            'email' => 'geral@aamihe.com',
            'name' => 'AAMIHE',
        ],
    ],
];
