import pool from "../libs/database.js";
import bcrypt, { hash } from "bcrypt";
import { hashPassword, comparePassword, createJWT } from "../libs/index.js";

// Hàm xử lý đăng ký người dùng mới
export const signUpUser = async (req, res) => {
  try {
    // Lấy thông tin từ request body
    const { firstName, email, password } = req.body;

    // Kiểm tra các trường cần thiết có đầy đủ không
    if (!firstName || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "Tất cả các trường đều bắt buộc",
      });
    }

    // Kiểm tra xem email đã tồn tại trong hệ thống chưa
    const existingUser = await pool.query(
      "SELECT * FROM tbluser WHERE email = $1",
      [email]
    );

    // Nếu email đã tồn tại, trả về lỗi conflict
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: false,
        message: "Người dùng đã tồn tại",
      });
    }

    // Mã hóa mật khẩu trước khi lưu vào database để bảo mật
    const hashedPassword = await hashPassword(password);

    // Thêm người dùng mới vào bảng tbluser và trả về thông tin người dùng vừa tạo
    const newUser = await pool.query(
      "INSERT INTO tbluser (firstname, email, password) VALUES ($1, $2, $3) RETURNING *",
      [firstName, email, hashedPassword]
    );

    // Lấy dữ liệu người dùng từ kết quả truy vấn
    const userData = newUser.rows[0];
    // Xóa mật khẩu khỏi response để không trả về cho client (bảo mật)
    userData.password = undefined;

    // Trả về phản hồi thành công với thông tin người dùng
    return res.status(201).json({
      status: true,
      message: "Tạo người dùng thành công",
      user: userData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm xử lý đăng nhập người dùng
export const signInUser = async (req, res) => {
  try {
    // Lấy email và password từ request body
    const { email, password } = req.body;

    // Tìm kiếm người dùng trong database theo email
    const result = await pool.query("SELECT * FROM tbluser WHERE email = $1", [
      email,
    ]);

    // Lấy thông tin người dùng từ kết quả truy vấn
    const user = result.rows[0];

    // Kiểm tra xem người dùng có tồn tại không
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "Người dùng không tồn tại" });
    }

    // So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong database
    const isMatch = await comparePassword(password, user?.password);

    // Nếu mật khẩu không khớp, trả về lỗi
    if (!isMatch) {
      return res
        .status(404)
        .json({ status: false, message: "Mật khẩu không chính xác" });
    }

    // Tạo JWT token để xác thực người dùng cho các request sau
    const token = createJWT(user.id);

    // Xóa mật khẩu khỏi object user trước khi trả về (bảo mật)
    user.password = undefined;

    // Trả về phản hồi thành công với thông tin người dùng và token
    return res
      .status(200)
      .json({ status: true, message: "Đăng nhập thành công", user, token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
