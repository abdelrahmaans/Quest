export type Lang = 'en' | 'ar';

/**
 * Translation key→string dictionary.
 * Add keys here as new UI text is needed.
 * Keep it simple — no i18n library, just a typed lookup.
 */
export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // Auth
    'auth.login.title':        'Welcome back',
    'auth.login.subtitle':     'Sign in to your Mada Quest account',
    'auth.login.email':        'Email address',
    'auth.login.password':     'Password',
    'auth.login.forgot':       'Forgot password?',
    'auth.login.submit':       'Sign in',
    'auth.login.google':       'Continue with Google',
    'auth.login.no_account':   "Don't have an account?",
    'auth.login.signup':       'Create account',
    'auth.login.signing_in':   'Signing in…',

    'auth.signup.title':       'Create your account',
    'auth.signup.subtitle':    'Join Mada Quest as an Instructor',
    'auth.signup.name':        'Full name',
    'auth.signup.email':       'Email address',
    'auth.signup.password':    'Password',
    'auth.signup.confirm':     'Confirm password',
    'auth.signup.submit':      'Create account',
    'auth.signup.creating':    'Creating account…',
    'auth.signup.has_account': 'Already have an account?',
    'auth.signup.login':       'Sign in',
    'auth.signup.role_note':   'All accounts start as Instructor. Admin access is granted by the platform team.',

    'auth.forgot.title':       'Forgot your password?',
    'auth.forgot.subtitle':    "Enter your email and we'll send you a reset link.",
    'auth.forgot.submit':      'Send reset link',
    'auth.forgot.sending':     'Sending…',
    'auth.forgot.back':        'Back to login',
    'auth.forgot.check_email': 'Check your email',

    'auth.reset.title':        'Create new password',
    'auth.reset.subtitle':     'Choose a strong password for your account.',
    'auth.reset.new_password': 'New password',
    'auth.reset.confirm':      'Confirm new password',
    'auth.reset.submit':       'Update password',
    'auth.reset.updating':     'Updating…',
    'auth.reset.success_title':'Password updated!',
    'auth.reset.success_msg':  'You will be redirected shortly.',
    'auth.reset.expired_title':'Link expired',
    'auth.reset.expired_msg':  'This reset link has expired or already been used.',
    'auth.reset.new_link':     'Request new link',

    // Errors
    'error.invalid_creds':     'Invalid email or password.',
    'error.email_unconfirmed': 'Please verify your email before logging in.',
    'error.too_many':          'Too many attempts. Please wait a moment.',
    'error.email_taken':       'This email is already registered. Try logging in.',

    // Common
    'common.email_placeholder':'you@example.com',
    'common.password_placeholder': '••••••••',
    'required.email':          'Email is required.',
    'invalid.email':           'Enter a valid email address.',
    'required.name':           'Name is required.',
    'min_length.name':         'Name must be at least 2 characters.',
    'min_length.password':     'Password must be at least 8 characters.',
    'mismatch.password':       'Passwords do not match.',

    // Brand
    'brand.tagline':           'Interactive Learning with Gamification',
    'brand.quote':             '"Empowering every student\'s journey"',
    'brand.tagline_ar':        'منصة التعلم التفاعلي بنظام Gamification',
    'brand.join_today':        'Start your learning journey today',
  },

  ar: {
    // Auth
    'auth.login.title':        'أهلاً بعودتك',
    'auth.login.subtitle':     'سجّل دخولك إلى حساب مدى Quest',
    'auth.login.email':        'البريد الإلكتروني',
    'auth.login.password':     'كلمة المرور',
    'auth.login.forgot':       'نسيت كلمة المرور؟',
    'auth.login.submit':       'تسجيل الدخول',
    'auth.login.google':       'المتابعة عبر Google',
    'auth.login.no_account':   'ليس لديك حساب؟',
    'auth.login.signup':       'إنشاء حساب',
    'auth.login.signing_in':   'جارٍ تسجيل الدخول…',

    'auth.signup.title':       'إنشاء حسابك',
    'auth.signup.subtitle':    'انضم إلى مدى Quest كمدرّس',
    'auth.signup.name':        'الاسم الكامل',
    'auth.signup.email':       'البريد الإلكتروني',
    'auth.signup.password':    'كلمة المرور',
    'auth.signup.confirm':     'تأكيد كلمة المرور',
    'auth.signup.submit':      'إنشاء الحساب',
    'auth.signup.creating':    'جارٍ الإنشاء…',
    'auth.signup.has_account': 'لديك حساب بالفعل؟',
    'auth.signup.login':       'تسجيل الدخول',
    'auth.signup.role_note':   'جميع الحسابات تبدأ كـ "مدرّس". يُمنح وصول الأدمن من قِبل فريق المنصة.',

    'auth.forgot.title':       'نسيت كلمة المرور؟',
    'auth.forgot.subtitle':    'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.',
    'auth.forgot.submit':      'إرسال رابط الاستعادة',
    'auth.forgot.sending':     'جارٍ الإرسال…',
    'auth.forgot.back':        'العودة لتسجيل الدخول',
    'auth.forgot.check_email': 'تحقق من بريدك الإلكتروني',

    'auth.reset.title':        'إنشاء كلمة مرور جديدة',
    'auth.reset.subtitle':     'اختر كلمة مرور قوية لحسابك.',
    'auth.reset.new_password': 'كلمة المرور الجديدة',
    'auth.reset.confirm':      'تأكيد كلمة المرور',
    'auth.reset.submit':       'تحديث كلمة المرور',
    'auth.reset.updating':     'جارٍ التحديث…',
    'auth.reset.success_title':'تم تحديث كلمة المرور!',
    'auth.reset.success_msg':  'ستُحوَّل إلى لوحة التحكم قريباً.',
    'auth.reset.expired_title':'انتهت صلاحية الرابط',
    'auth.reset.expired_msg':  'انتهت صلاحية رابط الاستعادة أو استُخدم من قبل.',
    'auth.reset.new_link':     'طلب رابط جديد',

    // Errors
    'error.invalid_creds':     'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'error.email_unconfirmed': 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.',
    'error.too_many':          'محاولات كثيرة. انتظر لحظة.',
    'error.email_taken':       'البريد مسجّل بالفعل. حاول تسجيل الدخول.',

    // Common
    'common.email_placeholder':'you@example.com',
    'common.password_placeholder': '••••••••',
    'required.email':          'البريد الإلكتروني مطلوب.',
    'invalid.email':           'أدخل بريداً إلكترونياً صحيحاً.',
    'required.name':           'الاسم مطلوب.',
    'min_length.name':         'يجب أن يكون الاسم حرفين على الأقل.',
    'min_length.password':     'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.',
    'mismatch.password':       'كلمتا المرور غير متطابقتين.',

    // Brand
    'brand.tagline':           'التعلم التفاعلي بنظام Gamification',
    'brand.quote':             '"نُمكّن رحلة كل طالب"',
    'brand.tagline_ar':        'منصة التعلم التفاعلي بنظام Gamification',
    'brand.join_today':        'ابدأ رحلتك التعليمية اليوم',
  },
};
