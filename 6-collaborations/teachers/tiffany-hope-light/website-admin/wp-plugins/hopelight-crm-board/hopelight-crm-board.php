<?php
/**
 * Plugin Name: 希望之光 CRM 看板
 * Plugin URI:  https://hopebox.com.tw/
 * Description: 在 WordPress 後台顯示 WooCommerce 顧客與訂單的整合看板。唯讀，不修改任何訂單資料。
 * Version:     0.1.0
 * Author:      mamasan-lab
 * Requires PHP: 7.4
 * Requires at least: 5.8
 * Text Domain: hopelight-crm
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HOPELIGHT_CRM_VERSION', '0.1.0' );
define( 'HOPELIGHT_CRM_CAPABILITY', 'manage_woocommerce' );
define( 'HOPELIGHT_CRM_ORDER_LIMIT', 1000 );

/**
 * 註冊後台選單。
 */
function hopelight_crm_menu() {
	add_menu_page(
		'希望之光 CRM',
		'希望之光 CRM',
		HOPELIGHT_CRM_CAPABILITY,
		'hopelight-crm',
		'hopelight_crm_render_page',
		'dashicons-groups',
		56
	);
}
add_action( 'admin_menu', 'hopelight_crm_menu' );

/**
 * 只在本外掛頁面載入字型。
 */
function hopelight_crm_assets( $hook ) {
	if ( 'toplevel_page_hopelight-crm' !== $hook ) {
		return;
	}
	wp_enqueue_style(
		'hopelight-crm-fonts',
		'https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Noto+Serif+TC:wght@500&display=swap',
		array(),
		HOPELIGHT_CRM_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'hopelight_crm_assets' );

/**
 * 訂單狀態的中文標籤。
 */
function hopelight_crm_status_label( $status ) {
	$labels = array(
		'pending'    => '待付款',
		'on-hold'    => '待核款',
		'processing' => '處理中',
		'completed'  => '已完成',
		'cancelled'  => '已取消',
		'refunded'   => '已退款',
		'failed'     => '失敗',
	);
	return isset( $labels[ $status ] ) ? $labels[ $status ] : $status;
}

/**
 * 讀取訂單並整理成陣列。唯讀。
 */
function hopelight_crm_collect_orders() {
	// 不指定 status，讓 WooCommerce 自己帶入所有正式狀態（會排除 trash 與結帳草稿）。
	$orders = wc_get_orders(
		array(
			'limit'   => HOPELIGHT_CRM_ORDER_LIMIT,
			'orderby' => 'date',
			'order'   => 'DESC',
		)
	);

	$rows = array();
	foreach ( $orders as $order ) {
		if ( ! $order instanceof WC_Order ) {
			continue;
		}

		$items = array();
		foreach ( $order->get_items() as $item ) {
			$items[] = array(
				'name'     => $item->get_name(),
				'quantity' => (int) $item->get_quantity(),
				'total'    => (float) $item->get_total(),
			);
		}

		$created = $order->get_date_created();
		$name    = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );

		$rows[] = array(
			'id'       => $order->get_id(),
			'number'   => $order->get_order_number(),
			'status'   => $order->get_status(),
			'date'     => $created ? $created->date_i18n( 'Y-m-d' ) : '',
			'sort_key' => $created ? $created->date_i18n( 'Y-m-d H:i:s' ) : '',
			'total'    => (float) $order->get_total(),
			'payment'  => $order->get_payment_method_title(),
			'customer' => $order->get_customer_id(),
			'name'     => '' !== $name ? $name : '（未填姓名）',
			'email'    => $order->get_billing_email(),
			'phone'    => $order->get_billing_phone(),
			'items'    => $items,
			'edit_url' => $order->get_edit_order_url(),
		);
	}

	return $rows;
}

/**
 * 依 Email／電話把訂單合併成顧客主檔，處理 WooCommerce 會員與訪客結帳的重複。
 */
function hopelight_crm_build_people( $orders ) {
	$people = array();

	foreach ( $orders as $order ) {
		$key = strtolower( $order['email'] );
		if ( '' === $key ) {
			$key = '' !== $order['phone'] ? $order['phone'] : 'name:' . $order['name'];
		}

		if ( ! isset( $people[ $key ] ) ) {
			$people[ $key ] = array(
				'name'        => $order['name'],
				'email'       => $order['email'],
				'phone'       => $order['phone'],
				'is_guest'    => ! $order['customer'],
				'orders'      => 0,
				'paid_total'  => 0.0,
				'open_count'  => 0,
				'open_total'  => 0.0,
				'last_order'  => '',
				'items'       => array(),
			);
		}

		$person = &$people[ $key ];
		$person['orders']++;

		if ( '' === $person['phone'] && '' !== $order['phone'] ) {
			$person['phone'] = $order['phone'];
		}
		if ( '（未填姓名）' === $person['name'] && '（未填姓名）' !== $order['name'] ) {
			$person['name'] = $order['name'];
		}
		if ( $order['customer'] ) {
			$person['is_guest'] = false;
		}
		if ( in_array( $order['status'], array( 'completed', 'processing' ), true ) ) {
			$person['paid_total'] += $order['total'];
		}
		if ( in_array( $order['status'], array( 'on-hold', 'pending' ), true ) ) {
			$person['open_count']++;
			$person['open_total'] += $order['total'];
		}
		if ( $order['date'] > $person['last_order'] ) {
			$person['last_order'] = $order['date'];
		}
		foreach ( $order['items'] as $item ) {
			if ( ! in_array( $item['name'], $person['items'], true ) ) {
				$person['items'][] = $item['name'];
			}
		}
		unset( $person );
	}

	uasort(
		$people,
		static function ( $a, $b ) {
			return strcmp( $b['last_order'], $a['last_order'] );
		}
	);

	return $people;
}

/**
 * 金額顯示。
 */
function hopelight_crm_money( $value ) {
	return 'NT$' . number_format( (float) $value );
}

/**
 * 匯出顧客主檔 CSV。
 */
function hopelight_crm_export_csv() {
	if ( ! current_user_can( HOPELIGHT_CRM_CAPABILITY ) ) {
		wp_die( '權限不足。', '', array( 'response' => 403 ) );
	}
	check_admin_referer( 'hopelight_crm_export' );

	$people   = hopelight_crm_build_people( hopelight_crm_collect_orders() );
	$filename = 'hopelight-customers-' . gmdate( 'Ymd-His' ) . '.csv';

	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=' . $filename );

	$output = fopen( 'php://output', 'w' );
	fwrite( $output, "\xEF\xBB\xBF" ); // BOM，讓 Excel 正確辨識中文。
	fputcsv( $output, array( '姓名', 'Email', '電話', '身分', '訂單數', '已成立金額', '待核款金額', '最近訂單', '買過什麼' ) );

	foreach ( $people as $person ) {
		fputcsv(
			$output,
			array(
				$person['name'],
				$person['email'],
				$person['phone'],
				$person['is_guest'] ? '訪客結帳' : '會員',
				$person['orders'],
				$person['paid_total'],
				$person['open_total'],
				$person['last_order'],
				implode( '、', $person['items'] ),
			)
		);
	}

	fclose( $output );
	exit;
}
add_action( 'admin_post_hopelight_crm_export', 'hopelight_crm_export_csv' );

/**
 * 後台頁面。
 */
function hopelight_crm_render_page() {
	if ( ! current_user_can( HOPELIGHT_CRM_CAPABILITY ) ) {
		wp_die( '權限不足。', '', array( 'response' => 403 ) );
	}

	if ( ! class_exists( 'WooCommerce' ) ) {
		echo '<div class="wrap"><h1>希望之光 CRM</h1><div class="notice notice-error"><p>找不到 WooCommerce。這個看板需要 WooCommerce 才能運作。</p></div></div>';
		return;
	}

	$orders = hopelight_crm_collect_orders();
	$people = hopelight_crm_build_people( $orders );

	$status_counts = array();
	$paid_total    = 0.0;
	$open_orders   = array();
	$open_total    = 0.0;
	$cancelled     = 0;
	$products      = array();

	foreach ( $orders as $order ) {
		$status                   = $order['status'];
		$status_counts[ $status ] = isset( $status_counts[ $status ] ) ? $status_counts[ $status ] + 1 : 1;

		if ( in_array( $status, array( 'completed', 'processing' ), true ) ) {
			$paid_total += $order['total'];
		}
		if ( in_array( $status, array( 'on-hold', 'pending' ), true ) ) {
			$open_orders[] = $order;
			$open_total   += $order['total'];
		}
		if ( 'cancelled' === $status ) {
			$cancelled++;
			continue;
		}
		foreach ( $order['items'] as $item ) {
			if ( ! isset( $products[ $item['name'] ] ) ) {
				$products[ $item['name'] ] = array( 'qty' => 0, 'total' => 0.0 );
			}
			$products[ $item['name'] ]['qty']   += $item['quantity'];
			$products[ $item['name'] ]['total'] += $item['total'];
		}
	}

	arsort( $status_counts );
	uasort(
		$products,
		static function ( $a, $b ) {
			return $b['total'] <=> $a['total'];
		}
	);

	$order_count  = count( $orders );
	$guest_count  = count( array_filter( $people, static function ( $person ) { return $person['is_guest']; } ) );
	$cancel_rate  = $order_count > 0 ? round( $cancelled / $order_count * 100 ) : 0;
	$export_url   = wp_nonce_url( admin_url( 'admin-post.php?action=hopelight_crm_export' ), 'hopelight_crm_export' );
	?>
	<div class="wrap hlcrm">
		<style>
			.hlcrm{
				--ink:#201C2E;--muted:#6B6480;--line:#DFDAE6;--ground:#F1EFF3;--surface:#fff;
				--gold:#9E6A1C;--good:#2F7A55;--info:#2B5F9E;--warn:#B4530C;--crit:#9E3434;
				--good-bg:#E4F0E9;--info-bg:#E3EBF6;--warn-bg:#F8E8DC;--crit-bg:#F5E2E2;--muted-bg:#E8E5EC;
				max-width:1240px;color:var(--ink);
			}
			.hlcrm *{box-sizing:border-box}
			.hlcrm .hl-head{display:flex;flex-wrap:wrap;gap:1rem;align-items:baseline;justify-content:space-between;margin:0 0 1.5rem}
			.hlcrm h1.hl-title{font-family:"Noto Serif TC",serif;font-weight:500;font-size:1.6rem;margin:0;padding:0;color:var(--ink)}
			.hlcrm .hl-sub{color:var(--muted);font-size:13px;margin:.25rem 0 0}
			.hlcrm .hl-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;
				background:var(--line);border:1px solid var(--line);border-radius:6px;overflow:hidden;margin-bottom:2rem}
			.hlcrm .hl-tile{background:var(--surface);padding:1rem 1.15rem}
			.hlcrm .hl-tile .k{font-family:"Jost",sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:block}
			.hlcrm .hl-tile .v{font-family:"Jost",sans-serif;font-size:1.7rem;font-variant-numeric:tabular-nums;display:block;line-height:1.35}
			.hlcrm .hl-tile .s{font-size:12px;color:var(--muted);display:block}
			.hlcrm .hl-tile.alert .v{color:var(--warn)}
			.hlcrm .hl-section{margin-bottom:2rem}
			.hlcrm h2.hl-h2{font-family:"Noto Serif TC",serif;font-weight:500;font-size:1.05rem;margin:0 0 .3rem;padding:0;color:var(--ink)}
			.hlcrm h2.hl-h2 small{font-family:"Jost",sans-serif;font-size:12px;color:var(--muted);font-weight:400;margin-left:.5rem}
			.hlcrm .hl-hint{color:var(--muted);font-size:13px;margin:0 0 .9rem}
			.hlcrm .hl-panel{background:var(--surface);border:1px solid var(--line);border-radius:6px;overflow:hidden}
			.hlcrm .hl-scroll{overflow-x:auto}
			.hlcrm table.hl-table{border-collapse:collapse;width:100%;min-width:44rem;font-size:13px;background:transparent}
			.hlcrm .hl-table th,.hlcrm .hl-table td{padding:.65rem .85rem;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
			.hlcrm .hl-table tbody tr:last-child td{border-bottom:0}
			.hlcrm .hl-table th{font-family:"Jost",sans-serif;font-weight:500;font-size:11px;letter-spacing:.1em;
				text-transform:uppercase;color:var(--muted);white-space:nowrap;background:var(--ground)}
			.hlcrm .hl-table td.num,.hlcrm .hl-table th.num{text-align:right;font-family:"Jost",sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap}
			.hlcrm .hl-strong{font-weight:600;white-space:nowrap}
			.hlcrm .hl-mono{font-family:"Jost",sans-serif;font-variant-numeric:tabular-nums}
			.hlcrm .hl-contact{font-size:12px;line-height:1.6}
			.hlcrm .hl-items{color:var(--muted);max-width:22rem}
			.hlcrm .hl-tag{display:inline-block;font-family:"Jost",sans-serif;font-size:10px;letter-spacing:.08em;
				color:var(--muted);background:var(--muted-bg);border-radius:3px;padding:.05rem .4rem;margin-left:.35rem;font-weight:400}
			.hlcrm .hl-pill{display:inline-block;font-size:11px;padding:.15rem .6rem;border-radius:999px;white-space:nowrap}
			.hlcrm .st-completed{background:var(--good-bg);color:var(--good)}
			.hlcrm .st-processing{background:var(--info-bg);color:var(--info)}
			.hlcrm .st-on-hold,.hlcrm .st-pending{background:var(--warn-bg);color:var(--warn)}
			.hlcrm .st-cancelled{background:var(--muted-bg);color:var(--muted)}
			.hlcrm .st-refunded,.hlcrm .st-failed{background:var(--crit-bg);color:var(--crit)}
			.hlcrm .hl-bars{padding:1.15rem}
			.hlcrm .hl-bar-row{display:grid;grid-template-columns:5.5rem 1fr 2rem;align-items:center;gap:.7rem;margin-bottom:.45rem}
			.hlcrm .hl-bar{display:block;height:.5rem;background:var(--muted-bg);border-radius:999px;overflow:hidden}
			.hlcrm .hl-bar i{display:block;height:100%;border-radius:999px;background:var(--muted)}
			.hlcrm .hl-bar i.st-completed{background:var(--good)}
			.hlcrm .hl-bar i.st-processing{background:var(--info)}
			.hlcrm .hl-bar i.st-on-hold,.hlcrm .hl-bar i.st-pending{background:var(--warn)}
			.hlcrm .hl-bar i.st-cancelled{background:var(--muted)}
			.hlcrm .hl-bar-row b{font-family:"Jost",sans-serif;font-variant-numeric:tabular-nums;text-align:right}
			.hlcrm .hl-controls{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.9rem;align-items:center}
			.hlcrm .hl-controls input[type=search]{flex:1;min-width:12rem;padding:.45rem .9rem;border:1px solid var(--line);
				border-radius:999px;background:var(--surface);color:var(--ink);font-size:13px;height:auto}
			.hlcrm .hl-chip{font-family:"Jost",sans-serif;font-size:12px;padding:.35rem .85rem;border:1px solid var(--line);
				border-radius:999px;background:var(--surface);color:var(--muted);cursor:pointer;line-height:1.5}
			.hlcrm .hl-chip[aria-pressed="true"]{border-color:var(--ink);color:var(--ink);font-weight:500}
			.hlcrm .hl-empty{padding:1.4rem;color:var(--muted);font-size:13px}
			.hlcrm .hl-split{display:grid;gap:1.5rem}
			@media(min-width:1000px){.hlcrm .hl-split{grid-template-columns:1.15fr .85fr}}
			.hlcrm .hl-foot{border-top:1px solid var(--line);padding-top:1.2rem;color:var(--muted);font-size:12px}
			.hlcrm a.hl-link{color:var(--info);text-decoration:none}
			.hlcrm a.hl-link:hover{text-decoration:underline}
		</style>

		<div class="hl-head">
			<div>
				<h1 class="hl-title">希望之光 CRM 看板</h1>
				<p class="hl-sub">即時讀取 WooCommerce 訂單｜唯讀，不會修改任何資料</p>
			</div>
			<p>
				<a class="button" href="<?php echo esc_url( $export_url ); ?>">下載顧客 CSV</a>
				<a class="button button-primary" href="<?php echo esc_url( admin_url( 'admin.php?page=hopelight-crm' ) ); ?>">重新整理</a>
			</p>
		</div>

		<?php if ( $order_count >= HOPELIGHT_CRM_ORDER_LIMIT ) : ?>
			<div class="notice notice-warning"><p>訂單數已達顯示上限 <?php echo esc_html( HOPELIGHT_CRM_ORDER_LIMIT ); ?> 筆，畫面只顯示最新的部分。</p></div>
		<?php endif; ?>

		<div class="hl-tiles">
			<div class="hl-tile"><span class="k">顧客</span><span class="v"><?php echo esc_html( count( $people ) ); ?></span><span class="s"><?php echo esc_html( $guest_count ); ?> 位訪客結帳</span></div>
			<div class="hl-tile"><span class="k">訂單</span><span class="v"><?php echo esc_html( $order_count ); ?></span><span class="s"><?php echo esc_html( $cancelled ); ?> 筆已取消</span></div>
			<div class="hl-tile"><span class="k">已成立金額</span><span class="v"><?php echo esc_html( hopelight_crm_money( $paid_total ) ); ?></span><span class="s">已完成＋處理中</span></div>
			<div class="hl-tile alert"><span class="k">待核款</span><span class="v"><?php echo esc_html( count( $open_orders ) ); ?></span><span class="s"><?php echo esc_html( hopelight_crm_money( $open_total ) ); ?> 等待確認</span></div>
			<div class="hl-tile"><span class="k">取消率</span><span class="v"><?php echo esc_html( $cancel_rate ); ?>%</span><span class="s"><?php echo esc_html( $cancelled . ' / ' . $order_count ); ?></span></div>
		</div>

		<div class="hl-section">
			<h2 class="hl-h2">今天要做的事 <small>待核款與待付款</small></h2>
			<p class="hl-hint">銀行轉帳的訂單需要人工對帳。確認入帳後，點訂單編號進去把狀態改成「處理中」。</p>
			<div class="hl-panel"><div class="hl-scroll">
			<?php if ( empty( $open_orders ) ) : ?>
				<p class="hl-empty">目前沒有待處理的訂單。</p>
			<?php else : ?>
				<table class="hl-table">
					<thead><tr><th>編號</th><th>日期</th><th>顧客</th><th>品項</th><th class="num">金額</th><th>付款方式</th><th>狀態</th></tr></thead>
					<tbody>
					<?php foreach ( $open_orders as $order ) : ?>
						<tr>
							<td class="hl-mono"><a class="hl-link" href="<?php echo esc_url( $order['edit_url'] ); ?>">#<?php echo esc_html( $order['number'] ); ?></a></td>
							<td><?php echo esc_html( $order['date'] ); ?></td>
							<td class="hl-strong"><?php echo esc_html( $order['name'] ); ?></td>
							<td class="hl-items"><?php echo esc_html( implode( '、', wp_list_pluck( $order['items'], 'name' ) ) ); ?></td>
							<td class="num"><?php echo esc_html( hopelight_crm_money( $order['total'] ) ); ?></td>
							<td><?php echo esc_html( $order['payment'] ); ?></td>
							<td><span class="hl-pill st-<?php echo esc_attr( $order['status'] ); ?>"><?php echo esc_html( hopelight_crm_status_label( $order['status'] ) ); ?></span></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
			</div></div>
		</div>

		<div class="hl-split">
			<div class="hl-section">
				<h2 class="hl-h2">訂單狀態分布</h2>
				<div class="hl-panel"><div class="hl-bars">
				<?php foreach ( $status_counts as $status => $count ) : ?>
					<div class="hl-bar-row">
						<span><span class="hl-pill st-<?php echo esc_attr( $status ); ?>"><?php echo esc_html( hopelight_crm_status_label( $status ) ); ?></span></span>
						<span class="hl-bar"><i class="st-<?php echo esc_attr( $status ); ?>" style="width:<?php echo esc_attr( $order_count > 0 ? ( $count / $order_count * 100 ) : 0 ); ?>%"></i></span>
						<b><?php echo esc_html( $count ); ?></b>
					</div>
				<?php endforeach; ?>
				</div></div>
			</div>

			<div class="hl-section">
				<h2 class="hl-h2">品項銷售 <small>不含已取消</small></h2>
				<div class="hl-panel"><div class="hl-scroll">
					<table class="hl-table" style="min-width:0">
						<thead><tr><th>品項</th><th class="num">數量</th><th class="num">金額</th></tr></thead>
						<tbody>
						<?php foreach ( $products as $name => $stats ) : ?>
							<tr>
								<td><?php echo esc_html( $name ); ?></td>
								<td class="num"><?php echo esc_html( $stats['qty'] ); ?></td>
								<td class="num"><?php echo esc_html( hopelight_crm_money( $stats['total'] ) ); ?></td>
							</tr>
						<?php endforeach; ?>
						</tbody>
					</table>
				</div></div>
			</div>
		</div>

		<div class="hl-section">
			<h2 class="hl-h2">顧客主檔 <small>訂單以 Email／電話合併，含訪客結帳</small></h2>
			<div class="hl-controls">
				<input type="search" id="hlPeopleSearch" placeholder="搜尋姓名、Email、電話、品項…" aria-label="搜尋顧客">
			</div>
			<div class="hl-panel"><div class="hl-scroll">
				<table class="hl-table" id="hlPeopleTable">
					<thead><tr><th>顧客</th><th>聯絡方式</th><th class="num">訂單</th><th class="num">已成立</th><th class="num">待核款</th><th>最近訂單</th><th>買過什麼</th></tr></thead>
					<tbody>
					<?php foreach ( $people as $person ) : ?>
						<tr data-search="<?php echo esc_attr( strtolower( $person['name'] . ' ' . $person['email'] . ' ' . $person['phone'] . ' ' . implode( ' ', $person['items'] ) ) ); ?>">
							<td class="hl-strong"><?php echo esc_html( $person['name'] ); ?><?php echo $person['is_guest'] ? '<span class="hl-tag">訪客結帳</span>' : ''; ?></td>
							<td class="hl-contact">
								<?php if ( $person['email'] ) : ?>
									<a class="hl-link" href="mailto:<?php echo esc_attr( $person['email'] ); ?>"><?php echo esc_html( $person['email'] ); ?></a><br>
								<?php endif; ?>
								<?php if ( $person['phone'] ) : ?>
									<span class="hl-mono"><?php echo esc_html( $person['phone'] ); ?></span>
								<?php endif; ?>
							</td>
							<td class="num"><?php echo esc_html( $person['orders'] ); ?></td>
							<td class="num"><?php echo esc_html( hopelight_crm_money( $person['paid_total'] ) ); ?></td>
							<td class="num"><?php echo $person['open_count'] ? esc_html( hopelight_crm_money( $person['open_total'] ) ) : '—'; ?></td>
							<td><?php echo esc_html( $person['last_order'] ? $person['last_order'] : '—' ); ?></td>
							<td class="hl-items"><?php echo esc_html( implode( '、', $person['items'] ) ); ?></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			</div></div>
		</div>

		<div class="hl-section">
			<h2 class="hl-h2">所有訂單</h2>
			<div class="hl-controls" id="hlOrderFilters">
				<input type="search" id="hlOrderSearch" placeholder="搜尋訂單編號、顧客、品項…" aria-label="搜尋訂單">
				<button type="button" class="hl-chip" data-status="all" aria-pressed="true">全部</button>
				<button type="button" class="hl-chip" data-status="on-hold" aria-pressed="false">待核款</button>
				<button type="button" class="hl-chip" data-status="processing" aria-pressed="false">處理中</button>
				<button type="button" class="hl-chip" data-status="completed" aria-pressed="false">已完成</button>
				<button type="button" class="hl-chip" data-status="cancelled" aria-pressed="false">已取消</button>
			</div>
			<div class="hl-panel"><div class="hl-scroll">
				<table class="hl-table" id="hlOrderTable">
					<thead><tr><th>編號</th><th>日期</th><th>顧客</th><th>品項</th><th class="num">金額</th><th>付款方式</th><th>狀態</th></tr></thead>
					<tbody>
					<?php foreach ( $orders as $order ) : ?>
						<?php
						$item_text = array();
						foreach ( $order['items'] as $item ) {
							$item_text[] = $item['name'] . ' ×' . $item['quantity'];
						}
						?>
						<tr data-status="<?php echo esc_attr( $order['status'] ); ?>"
							data-search="<?php echo esc_attr( strtolower( $order['number'] . ' ' . $order['name'] . ' ' . $order['email'] . ' ' . $order['phone'] . ' ' . implode( ' ', $item_text ) ) ); ?>">
							<td class="hl-mono"><a class="hl-link" href="<?php echo esc_url( $order['edit_url'] ); ?>">#<?php echo esc_html( $order['number'] ); ?></a></td>
							<td><?php echo esc_html( $order['date'] ); ?></td>
							<td class="hl-strong"><?php echo esc_html( $order['name'] ); ?></td>
							<td class="hl-items"><?php echo esc_html( implode( '、', $item_text ) ); ?></td>
							<td class="num"><?php echo esc_html( hopelight_crm_money( $order['total'] ) ); ?></td>
							<td><?php echo esc_html( $order['payment'] ); ?></td>
							<td><span class="hl-pill st-<?php echo esc_attr( $order['status'] ); ?>"><?php echo esc_html( hopelight_crm_status_label( $order['status'] ) ); ?></span></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			</div></div>
		</div>

		<p class="hl-foot">
			這個看板是唯讀的，不會修改任何訂單。要改狀態、地址或付款，請點訂單編號進 WooCommerce 訂單頁操作——那裡才是正式主檔。<br>
			可見範圍：具備 <code>manage_woocommerce</code> 權限的帳號（管理員與商店經理）。
		</p>
	</div>

	<script>
	(function(){
		function wire(inputId, tableId){
			var input = document.getElementById(inputId);
			var rows = Array.prototype.slice.call(document.querySelectorAll('#' + tableId + ' tbody tr'));
			var apply = function(){
				var q = input ? input.value.trim().toLowerCase() : '';
				rows.forEach(function(row){
					var okText = !q || (row.getAttribute('data-search') || '').indexOf(q) > -1;
					var okStatus = !row.dataset.hlHidden;
					row.style.display = (okText && okStatus) ? '' : 'none';
				});
			};
			if (input) { input.addEventListener('input', apply); }
			return apply;
		}
		wire('hlPeopleSearch', 'hlPeopleTable');
		var applyOrders = wire('hlOrderSearch', 'hlOrderTable');
		var chips = Array.prototype.slice.call(document.querySelectorAll('#hlOrderFilters .hl-chip'));
		var orderRows = Array.prototype.slice.call(document.querySelectorAll('#hlOrderTable tbody tr'));
		chips.forEach(function(chip){
			chip.addEventListener('click', function(){
				chips.forEach(function(other){ other.setAttribute('aria-pressed', String(other === chip)); });
				var want = chip.getAttribute('data-status');
				orderRows.forEach(function(row){
					if (want === 'all' || row.getAttribute('data-status') === want) { delete row.dataset.hlHidden; }
					else { row.dataset.hlHidden = '1'; }
				});
				applyOrders();
			});
		});
	})();
	</script>
	<?php
}
