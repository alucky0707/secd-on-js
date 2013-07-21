; 述語
(define null? (lambda (x) (eq? x '())))
(define not (lambda (x) (if (eq? x #f) #t #f)))

; cxxr
(define cadr (lambda (x) (car (cdr x))))
(define cdar (lambda (x) (cdr (car x))))
(define caar (lambda (x) (car (car x))))
(define cddr (lambda (x) (cdr (cdr x))))
(define cadar (lambda (x) (car (cdr (car x)))))

;;; リスト操作関数

(define list (lambda args args))

(define append
  (lambda (xs ys)
    (if (null? xs)
        ys
      (cons (car xs) (append (cdr xs) ys)))))

; リストの探索
(define memq
  (lambda (x ls)
    (if (null? ls)
        #f
        (if (eq? x (car ls))
            ls
          (memq x (cdr ls))))))

(define memv
  (lambda (x ls)
    (if (null? ls)
        #f
        (if (eqv? x (car ls))
            ls
          (memv x (cdr ls))))))

; 連想リストの探索
(define assq
  (lambda (x ls)
    (if (null? ls)
        #f
      (if (eq? x (car (car ls)))
          (car ls)
        (assq x (cdr ls))))))

;
(define assv
  (lambda (x ls)
    (if (null? ls)
        #f
      (if (eqv? x (car (car ls)))
          (car ls)
        (assv x (cdr ls))))))

;;; 高階関数

; マッピング
(define map
  (lambda (fn ls)
    (if (null? ls)
        '()
      (cons (fn (car ls)) (map fn (cdr ls))))))

(define map-2
  (lambda (fn xs ys)
    (if (null? xs)
        '()
      (cons (fn (car xs) (car ys)) (map-2 fn (cdr xs) (cdr ys))))))

; フィルター
(define filter
  (lambda (fn ls)
    (if (null? ls)
        '()
      (if (fn (car ls))
          (cons (car ls) (filter fn (cdr ls)))
        (filter fn (cdr ls))))))

; 畳み込み
(define fold-right
  (lambda (fn a ls)
    (if (null? ls)
        a
      (fn (car ls) (fold-right fn a (cdr ls))))))

(define fold-left
  (lambda (fn a ls)
    (if (null? ls)
        a
      (fold-left fn (fn a (car ls)) (cdr ls)))))


;;; マクロ

; quasiquote
(define transfer
  (lambda (ls)
    (if (pair? ls)
        (if (pair? (car ls))
            (if (eq? (caar ls) 'unquote)
                (list 'cons (cadar ls) (transfer (cdr ls)))
              (if (eq? (caar ls) 'unquote-splicing)
                  (list 'append (cadar ls) (transfer (cdr ls)))
                (list 'cons (transfer (car ls)) (transfer (cdr ls)))))
          (list 'cons (list 'quote (car ls)) (transfer (cdr ls))))
      (list 'quote ls))))

(define-macro quasiquote (lambda (x) (transfer x)))

; let (named-let)
(define-macro let
  (lambda (args . body)
    (if (pair? args)
        `((lambda ,(map car args) ,@body) ,@(map cadr args))
      ; named-let
      `(letrec ((,args (lambda ,(map car (car body)) ,@(cdr body))))
        (,args ,@(map cadr (car body)))))))

; and
(define-macro and
  (lambda args
    (if (null? args)
        #t
      (if (null? (cdr args))
          (car args)
        `(if ,(car args) (and ,@(cdr args)) #f)))))

; or
(define-macro or
  (lambda args
    (if (null? args)
        #f
      (if (null? (cdr args))
          (car args)
        `(let ((+value+ ,(car args)))
          (if +value+ +value+ (or ,@(cdr args))))))))

; let*
(define-macro let*
  (lambda (args . body) 
    (if (null? (cdr args))
        `(let (,(car args)) ,@body)
      `(let (,(car args)) (let* ,(cdr args) ,@body)))))

; letrec
(define-macro letrec
  (lambda (args . body)
    (let ((vars (map car args))
          (vals (map cadr args)))
      `(let ,(map (lambda (x) `(,x '*undef*)) vars)
            ,@(map-2 (lambda (x y) `(set! ,x ,y)) vars vals)
            ,@body))))

; begin
(define-macro begin
  (lambda args
    (if (null? args)
        `((lambda () '*undef*))
      `((lambda () ,@args)))))

; cond
(define-macro cond
  (lambda args
    (if (null? args)
        '*undef*
      (if (eq? (caar args) 'else)
          `(begin ,@(cdar args))
        (if (null? (cdar args))
            (caar args)
          `(if ,(caar args)
               (begin ,@(cdar args))
            (cond ,@(cdr args))))))))

; case
(define-macro case
  (lambda (key . args)
    (if (null? args)
        '*undef*
      (if (eq? (caar args) 'else)
          `(begin ,@(cdar args))
        `(if (memv ,key ',(caar args))
             (begin ,@(cdar args))
           (case ,key ,@(cdr args)))))))

; do
(define-macro do
  (lambda (var-form test-form . args)
    (let ((vars (map car var-form))
          (vals (map cadr var-form))
          (step (map cddr var-form)))
      `(letrec ((loop (lambda ,vars
                        (if ,(car test-form)
                            (begin ,@(cdr test-form))
                          (begin
                            ,@args
                            (loop ,@(map-2 (lambda (x y)
                                             (if (null? x) y (car x)))
                                           step
                                           vars)))))))
        (loop ,@vals)))))

;;; マクロを使った関数の定義

; reverse
(define reverse
  (lambda (ls)
    (letrec ((iter (lambda (ls a)
                     (if (null? ls)
                         a
                       (iter (cdr ls) (cons (car ls) a))))))
      (iter ls '()))))

; reverse (named-let 版)
(define reversei
  (lambda (ls)
    (let loop ((ls ls) (a '()))
      (if (null? ls)
          a
          (loop (cdr ls) (cons (car ls) a))))))

;;; 継続のテスト

(define bar1 (lambda (cont) (display "call bar1\n")))
(define bar2 (lambda (cont) (display "call bar2\n") (cont #f)))
(define bar3 (lambda (cont) (display "call bar3\n")))
(define test (lambda (cont) (bar1 cont) (bar2 cont) (bar3 cont)))

;
(define find-do
  (lambda (fn ls)
    (call/cc
      (lambda (k)
        (do ((xs ls (cdr xs)))
            ((null? xs) #f)
          (if (fn (car xs)) (k (car xs))))))))

;
(define map-check (lambda (fn chk ls)
  (call/cc
    (lambda (k)
      (map (lambda (x) (if (chk x) (k '()) (fn x))) ls)))))

;
(define flatten (lambda (ls)
  (call/cc
    (lambda (cont)
      (letrec ((flatten-sub
                (lambda (ls)
                  (cond ((null? ls) '())
                        ((not (pair? ls)) (list ls))
                        ((null? (car ls)) (cont '()))
                        (else (append (flatten-sub (car ls))
                                      (flatten-sub (cdr ls))))))))
        (flatten-sub ls))))))

;
(define make-iter
 (lambda (proc . args)
  (letrec ((iter
            (lambda (return)
              (apply 
                proc
                (lambda (x)             ; 高階関数に渡す関数の本体
                  (set! return          ; 脱出先継続の書き換え
                   (call/cc
                    (lambda (cont)
                      (set! iter cont)  ; 継続の書き換え
                      (return x)))))
                args)
                ; 終了後は継続 return で脱出
                (return #f))))
    (lambda ()
      (call/cc
        (lambda (cont) (iter cont)))))))

;
(define for-each-tree
 (lambda (fn ls)
  (let loop ((ls ls))
    (cond ((null? ls) '())
          ((pair? ls)
           (loop (car ls))
           (loop (cdr ls)))
          (else (fn ls))))))
