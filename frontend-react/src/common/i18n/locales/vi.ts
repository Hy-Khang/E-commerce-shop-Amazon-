export const vi = {
  toast: {
    order: {
      placed: 'Đặt hàng thành công!',
      cancelled: 'Đã hủy đơn hàng',
      statusUpdated: 'Đã cập nhật trạng thái đơn hàng',
      paymentUpdated: 'Đã cập nhật trạng thái thanh toán',
    },
    auth: {
      loggedOut: 'Đã đăng xuất',
      roleUpdated: 'Đã cập nhật vai trò người dùng',
      statusUpdated: 'Đã cập nhật trạng thái người dùng',
    },
    review: {
      submitted: 'Đã gửi đánh giá',
      deleted: 'Đã xóa đánh giá',
    },
    wishlist: {
      added: 'Đã thêm vào yêu thích',
      removed: 'Đã xóa khỏi yêu thích',
    },
    coupon: {
      created: 'Đã tạo mã giảm giá',
      updated: 'Đã cập nhật mã giảm giá',
      deactivated: 'Đã vô hiệu hóa mã giảm giá',
    },
    product: {
      created: 'Đã tạo sản phẩm',
      updated: 'Đã cập nhật sản phẩm',
      statusUpdated: 'Đã cập nhật trạng thái sản phẩm',
    },
    variant: {
      added: 'Đã thêm biến thể',
      updated: 'Đã cập nhật biến thể',
      deleted: 'Đã xóa biến thể',
    },
    image: {
      added: 'Đã thêm hình ảnh',
      updated: 'Đã cập nhật hình ảnh',
      deleted: 'Đã xóa hình ảnh',
    },
    category: {
      created: 'Đã tạo danh mục',
      updated: 'Đã cập nhật danh mục',
      deleted: 'Đã xóa danh mục',
    },
    profile: {
      updated: 'Đã cập nhật hồ sơ',
    },
    address: {
      added: 'Đã thêm địa chỉ',
      updated: 'Đã cập nhật địa chỉ',
      deleted: 'Đã xóa địa chỉ',
      defaultSet: 'Đã đặt địa chỉ mặc định',
    },
    cart: {
      added: 'Đã thêm vào giỏ hàng',
      removed: 'Đã xóa khỏi giỏ hàng',
    },
    error: {
      generic: 'Đã xảy ra lỗi',
    },
  },
} as const;
