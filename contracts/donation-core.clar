(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-CAUSE-ID u101)
(define-constant ERR-INVALID-AMOUNT u102)
(define-constant ERR-CAUSE-NOT-FOUND u103)
(define-constant ERR-DONATION-NOT-FOUND u104)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u105)
(define-constant ERR-INVALID-TIMESTAMP u106)
(define-constant ERR-INVALID-TITLE u107)
(define-constant ERR-INVALID-DESCRIPTION u108)
(define-constant ERR-INVALID-TARGET u109)
(define-constant ERR-CAUSE-ALREADY-EXISTS u110)
(define-constant ERR-MAX-CAUSES-EXCEEDED u111)
(define-constant ERR-INVALID-UPDATE-PARAM u112)
(define-constant ERR-UPDATE-NOT-ALLOWED u113)

(define-data-var total-donations uint u0)
(define-data-var total-causes uint u0)
(define-data-var max-causes uint u1000)
(define-data-var creation-fee uint u1000)
(define-data-var authority-contract (optional principal) none)

(define-map donations
  { donation-id: uint }
  { donor: principal, cause-id: uint, amount: uint, timestamp: uint }
)
(define-map causes
  { cause-id: uint }
  { title: (string-ascii 100), description: (string-ascii 500), target: uint, collected: uint, organization: principal, status: bool, timestamp: uint }
)
(define-map causes-by-title
  { title: (string-ascii 100) }
  { cause-id: uint }
)
(define-map donation-updates
  { donation-id: uint }
  { updated-amount: uint, updated-timestamp: uint, updater: principal }
)

(define-read-only (get-donation (donation-id uint))
  (map-get? donations { donation-id: donation-id })
)

(define-read-only (get-cause (cause-id uint))
  (map-get? causes { cause-id: cause-id })
)

(define-read-only (get-donation-updates (donation-id uint))
  (map-get? donation-updates { donation-id: donation-id })
)

(define-read-only (is-cause-registered (title (string-ascii 100)))
  (is-some (map-get? causes-by-title { title: title }))
)

(define-private (validate-title (title (string-ascii 100)))
  (if (and (> (len title) u0) (<= (len title) u100))
      (ok true)
      (err ERR-INVALID-TITLE))
)

(define-private (validate-description (description (string-ascii 500)))
  (if (and (> (len description) u0) (<= (len description) u500))
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-amount (amount uint))
  (if (> amount u0)
      (ok true)
      (err ERR-INVALID-AMOUNT))
)

(define-private (validate-target (target uint))
  (if (> target u0)
      (ok true)
      (err ERR-INVALID-TARGET))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-creation-fee (new-fee uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set creation-fee new-fee)
    (ok true)
  )
)

(define-public (register-cause (title (string-ascii 100)) (description (string-ascii 500)) (target uint))
  (let
    (
      (cause-id (var-get total-causes))
      (authority (var-get authority-contract))
    )
    (asserts! (< cause-id (var-get max-causes)) (err ERR-MAX-CAUSES-EXCEEDED))
    (try! (validate-title title))
    (try! (validate-description description))
    (try! (validate-target target))
    (asserts! (is-none (map-get? causes-by-title { title: title })) (err ERR-CAUSE-ALREADY-EXISTS))
    (try! (stx-transfer? (var-get creation-fee) tx-sender (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
    (map-set causes
      { cause-id: cause-id }
      { title: title, description: description, target: target, collected: u0, organization: tx-sender, status: true, timestamp: block-height }
    )
    (map-set causes-by-title { title: title } { cause-id: cause-id })
    (var-set total-causes (+ cause-id u1))
    (print { event: "cause-registered", id: cause-id })
    (ok cause-id)
  )
)

(define-public (register-donation (cause-id uint) (amount uint))
  (let
    (
      (donation-id (+ (var-get total-donations) u1))
      (cause (unwrap! (map-get? causes { cause-id: cause-id }) (err ERR-CAUSE-NOT-FOUND)))
      (new-collected (+ (get collected cause) amount))
    )
    (try! (validate-amount amount))
    (try! (stx-transfer? amount tx-sender (get organization cause)))
    (map-set donations
      { donation-id: donation-id }
      { donor: tx-sender, cause-id: cause-id, amount: amount, timestamp: block-height }
    )
    (map-set causes
      { cause-id: cause-id }
      { title: (get title cause), description: (get description cause), target: (get target cause), collected: new-collected, organization: (get organization cause), status: (get status cause), timestamp: (get timestamp cause) }
    )
    (var-set total-donations donation-id)
    (print { event: "donation-registered", id: donation-id })
    (ok donation-id)
  )
)

(define-public (update-donation (donation-id uint) (new-amount uint))
  (let
    (
      (donation (unwrap! (map-get? donations { donation-id: donation-id }) (err ERR-DONATION-NOT-FOUND)))
      (cause (unwrap! (map-get? causes { cause-id: (get cause-id donation) }) (err ERR-CAUSE-NOT-FOUND)))
    )
    (asserts! (is-eq (get donor donation) tx-sender) (err ERR-NOT-AUTHORIZED))
    (try! (validate-amount new-amount))
    (map-set donations
      { donation-id: donation-id }
      { donor: (get donor donation), cause-id: (get cause-id donation), amount: new-amount, timestamp: block-height }
    )
    (map-set donation-updates
      { donation-id: donation-id }
      { updated-amount: new-amount, updated-timestamp: block-height, updater: tx-sender }
    )
    (map-set causes
      { cause-id: (get cause-id donation) }
      { title: (get title cause), description: (get description cause), target: (get target cause), collected: (+ (- (get collected cause) (get amount donation)) new-amount), organization: (get organization cause), status: (get status cause), timestamp: (get timestamp cause) }
    )
    (print { event: "donation-updated", id: donation-id })
    (ok true)
  )
)

(define-public (get-donation-count)
  (ok (var-get total-donations))
)

(define-public (get-cause-count)
  (ok (var-get total-causes))
)