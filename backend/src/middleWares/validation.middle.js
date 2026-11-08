import ApiError from '../utils/ApiError.js';

const LABELS = {
  userName: 'اسم المستخدم', email: 'الإيميل', password: 'كلمة السر', confirmPassword: 'تأكيد كلمة السر',
  phone: 'رقم الموبايل', currentPassword: 'كلمة السر الحالية', newPassword: 'كلمة السر الجديدة',
  content: 'الرسالة', reciever: 'المستلم', messageId: 'الرسالة', flag: 'نوع الصندوق', resetToken: 'رابط الاستعادة', userId: 'الحساب',
};

const text = (d) => {
  const label = LABELS[d.path[0]] || 'القيمة';
  switch (d.type) {
    case 'any.required': case 'string.empty': return `${label} مطلوب.`;
    case 'string.min': return `${label} لازم يكون ${d.context.limit} حروف على الأقل.`;
    case 'string.max': return `${label} لازم ميزيدش عن ${d.context.limit} حرف.`;
    case 'string.email': return 'اكتب إيميل صحيح.';
    case 'string.base': case 'any.invalid': case 'any.only': return `${label} غير صحيح.`;
    default: return 'البيانات المدخلة غير صحيحة.';
  }
};

/** Maps the first Joi failure to a catalog error; every failed field is listed in `details`. */
export const toValidationError = (joiError) => {
  const [first] = joiError.details;
  const field = first.path[0];
  const details = joiError.details.map((d) => ({ field: d.path[0], type: d.type, message: text(d) }));
  if (field === 'content' && ['any.required', 'string.empty'].includes(first.type)) return new ApiError('MESSAGE_EMPTY', details);
  if (field === 'content' && first.type === 'string.max') return new ApiError('MESSAGE_TOO_LONG', details);
  if (field === 'reciever' || field === 'userId') return new ApiError('USER_NOT_FOUND', details);
  if (field === 'messageId') return new ApiError('MESSAGE_NOT_FOUND', details);
  if (field === 'confirmPassword' && first.type === 'any.only') return new ApiError('PASSWORD_MISMATCH', details);
  if (field === 'newPassword' && first.type === 'any.invalid') return new ApiError('PASSWORD_SAME_AS_OLD', details);
  const err = new ApiError('VALIDATION_ERROR', details);
  err.message = details[0].message; // first concrete reason, already Arabic
  return err;
};

// Precedence: route params > query > body, so a body can never override the resource id in the URL.
const validation = (schema) => (req, _res, next) => {
  const result = schema.validate({ ...req.body, ...req.query, ...req.params }, { abortEarly: false, convert: true });
  if (result.error) return next(toValidationError(result.error));
  req.validated = result.value;
  next();
};
export default validation;
