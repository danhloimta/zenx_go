import type { Metadata } from 'next';
import { LegalList, LegalPage, LegalSection, LegalSubsection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: 'Chính sách thu thập, sử dụng và bảo vệ dữ liệu cá nhân của ZENX GO.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Chính sách bảo mật"
      description="Chính sách này giải thích cách ZENX GO thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ dữ liệu cá nhân khi bạn sử dụng tài khoản, ví ZENX Coin và các dịch vụ liên quan."
    >
      <LegalSection title="1. GIỚI THIỆU">
        <LegalSubsection title="1.1. Phạm vi chính sách">
          <p>
            Chào mừng bạn đến với các sản phẩm và dịch vụ của ZENX GO, bao gồm nền tảng tài khoản và
            ví ZENX Coin. Trong Chính sách này, “Chúng tôi” hoặc “ZENX GO” là đơn vị vận hành các
            dịch vụ đó; “Người dùng” là cá nhân tạo tài khoản, cung cấp dữ liệu hoặc sử dụng
            website, ứng dụng, nền tảng và các sản phẩm trực tuyến của chúng tôi.
          </p>
          <p>
            ZENX GO coi trọng dữ liệu cá nhân mà bạn chia sẻ. Chính sách này trình bày các nguyên
            tắc về việc thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ dữ liệu để bạn có đủ thông tin
            trước khi quyết định cung cấp dữ liệu cho chúng tôi.
          </p>
        </LegalSubsection>
        <LegalSubsection title="1.2. Dữ liệu cá nhân là gì?">
          <p>
            “Dữ liệu cá nhân” hoặc “Thông tin cá nhân” là thông tin, dù chính xác hay chưa, có thể
            nhận diện trực tiếp hoặc gián tiếp một cá nhân, hoặc có thể kết hợp với dữ liệu khác để
            nhận diện cá nhân đó. Dữ liệu có thể gồm họ tên, tuổi, ngày sinh, số điện thoại, địa
            chỉ, email, thông tin thanh toán, hình ảnh, âm thanh và các thông tin khác bạn cung cấp
            hoặc tạo ra khi sử dụng Dịch vụ.
          </p>
        </LegalSubsection>
        <LegalSubsection title="1.3. Sự chấp thuận của Người dùng">
          <p>Khi đăng ký tài khoản, sử dụng Dịch vụ hoặc cung cấp dữ liệu, bạn xác nhận rằng:</p>
          <LegalList>
            <li>Bạn đã đọc, hiểu Chính sách này và các điều khoản có liên quan.</li>
            <li>
              Bạn đồng ý để ZENX GO thu thập, xử lý, lưu trữ và chia sẻ dữ liệu theo nội dung Chính
              sách này.
            </li>
            <li>
              Nếu không đồng ý, bạn cần ngừng sử dụng Dịch vụ và không tiếp tục cung cấp dữ liệu.
            </li>
            <li>
              Chính sách có thể được cập nhật. Việc tiếp tục sử dụng Dịch vụ sau khi cập nhật được
              xem là bạn đã chấp nhận phiên bản mới trong phạm vi pháp luật cho phép.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="1.4. Mối quan hệ với tài liệu khác">
          <p>
            Chính sách này được áp dụng cùng các thông báo, điều khoản và thỏa thuận khác liên quan
            đến việc xử lý dữ liệu cá nhân, trừ khi tài liệu cụ thể có quy định khác. Chính sách
            không thay thế các nghĩa vụ hoặc cam kết riêng đã được thông báo hợp lệ cho Người dùng.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="2. KHI NÀO ZENX GO THU THẬP DỮ LIỆU CÁ NHÂN?">
        <LegalSubsection title="2.1. Dữ liệu do Người dùng cung cấp">
          <p>ZENX GO có thể thu thập dữ liệu cá nhân trong các trường hợp sau:</p>
          <LegalList>
            <li>
              Khi bạn đăng ký, kích hoạt hoặc sử dụng tài khoản, Dịch vụ, ứng dụng hay nền tảng.
            </li>
            <li>
              Khi bạn điền và gửi biểu mẫu, đơn đăng ký, khảo sát hoặc tài liệu trực tuyến/giấy.
            </li>
            <li>
              Khi ký kết thỏa thuận, cung cấp hồ sơ hoặc thông tin phục vụ giao dịch, hợp tác.
            </li>
            <li>
              Khi bạn liên hệ với chúng tôi qua điện thoại, email, tin nhắn, thư tín, gặp trực tiếp,
              mạng xã hội hoặc kênh liên lạc khác; cuộc gọi có thể được ghi âm khi pháp luật cho
              phép.
            </li>
            <li>
              Khi bạn truy cập website hoặc ứng dụng, kể cả dữ liệu từ cookie và công nghệ tương tự.
            </li>
            <li>
              Khi bạn cấp quyền cho thiết bị truy cập vị trí, danh bạ, hình ảnh, âm thanh hoặc dữ
              liệu khác.
            </li>
            <li>
              Khi bạn liên kết Tài khoản với mạng xã hội hoặc tài khoản của dịch vụ bên ngoài.
            </li>
            <li>Khi bạn nạp ZENX Coin, thực hiện giao dịch hoặc yêu cầu hỗ trợ.</li>
            <li>Khi bạn gửi phản hồi, ý kiến, yêu cầu hoặc khiếu nại.</li>
            <li>
              Khi bạn đăng ký hoặc tham gia sự kiện, chương trình, cuộc thi hay hoạt động truyền
              thông.
            </li>
            <li>Khi bạn chủ động cung cấp dữ liệu vì bất kỳ mục đích hợp pháp nào.</li>
            <li>
              Khi bạn tham gia các hoạt động khác trên sản phẩm, nền tảng hoặc kênh truyền thông của
              ZENX GO.
            </li>
          </LegalList>
          <p>
            Danh sách trên mang tính minh họa và không giới hạn mọi trường hợp ZENX GO có thể thu
            thập dữ liệu theo tính năng hoặc bối cảnh cụ thể.
          </p>
        </LegalSubsection>
        <LegalSubsection title="2.2. Dữ liệu từ nguồn khác">
          <p>Ngoài dữ liệu bạn trực tiếp cung cấp, ZENX GO có thể nhận dữ liệu hợp pháp từ:</p>
          <LegalList>
            <li>
              Công ty liên kết, đối tác chiến lược và nhà cung cấp thanh toán, kỹ thuật, hạ tầng
              hoặc truyền thông.
            </li>
            <li>
              Đơn vị marketing, giới thiệu khách hàng, đánh giá tín dụng hoặc chương trình khách
              hàng thân thiết.
            </li>
            <li>
              Người dùng khác, chẳng hạn khi họ mời bạn tham gia sự kiện hoặc chia sẻ thông tin về
              bạn.
            </li>
            <li>Nguồn công khai hoặc cơ quan nhà nước theo quy định pháp luật.</li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="2.3. Dữ liệu của người khác">
          <p>
            Bạn có thể cung cấp cho ZENX GO thông tin của người khác, chẳng hạn người thân, bạn bè
            hoặc người trong danh bạ. Khi làm vậy, bạn xác nhận đã có sự đồng ý hợp pháp của họ và
            có quyền cung cấp dữ liệu để ZENX GO xử lý theo Chính sách này.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="3. LOẠI DỮ LIỆU CÁ NHÂN ZENX GO CÓ THỂ THU THẬP">
        <LegalSubsection title="3.1. Danh mục dữ liệu">
          <p>
            Tùy vào Dịch vụ bạn sử dụng và quyền bạn cấp, ZENX GO có thể thu thập dữ liệu cá nhân cơ
            bản hoặc nhạy cảm, gồm một phần hoặc toàn bộ các nhóm sau:
          </p>
          <LegalList>
            <li>Họ và tên.</li>
            <li>Địa chỉ email.</li>
            <li>Ngày, tháng, năm sinh.</li>
            <li>Địa chỉ liên hệ.</li>
            <li>Số điện thoại.</li>
            <li>Giới tính.</li>
            <li>Thông tin tài khoản ngân hàng, phương thức thanh toán và lịch sử giao dịch.</li>
            <li>
              Dữ liệu thiết bị như địa chỉ IP, loại thiết bị, hệ điều hành và thông tin phần
              cứng/phần mềm.
            </li>
            <li>Danh bạ hoặc danh sách tương tác khi bạn đã cấp quyền.</li>
            <li>Nội dung văn bản, hình ảnh, âm thanh hoặc video do bạn tạo hay cung cấp.</li>
            <li>Dữ liệu, tài nguyên và thông tin phát sinh từ hoạt động trên nền tảng.</li>
            <li>
              Thông tin nhận dạng do cơ quan cấp hoặc dữ liệu phục vụ xác minh danh tính, KYC, chống
              gian lận.
            </li>
            <li>Dữ liệu liên lạc, lựa chọn tiếp thị, phương thức liên hệ và lịch sử trao đổi.</li>
            <li>
              Lịch sử sử dụng Dịch vụ, dữ liệu giao dịch và nội dung số bạn truy cập hoặc tương tác.
            </li>
            <li>Tên tài khoản và ảnh đại diện trên mạng xã hội.</li>
            <li>Danh sách bạn bè trên mạng xã hội, nếu tính năng và quyền truy cập cho phép.</li>
          </LegalList>
          <p>
            Đây là các nhóm dữ liệu phổ biến, không phải danh sách đầy đủ. Dữ liệu thực tế phụ thuộc
            vào tính năng, thiết bị và cách bạn tương tác với ZENX GO.
          </p>
        </LegalSubsection>
        <LegalSubsection title="3.2. Tính chính xác của thông tin">
          <p>
            Thông tin bạn cung cấp có thể đúng hoặc chưa chính xác. ZENX GO không bắt buộc phải xác
            minh mọi dữ liệu, trừ khi việc xác minh cần cho Dịch vụ hoặc được pháp luật yêu cầu. Bạn
            chịu trách nhiệm về tính trung thực, đầy đủ và hợp pháp của dữ liệu đã cung cấp.
          </p>
        </LegalSubsection>
        <LegalSubsection title="3.3. Tài khoản mạng xã hội">
          <p>
            Khi đăng nhập hoặc liên kết Tài khoản với mạng xã hội, ZENX GO có thể nhận các dữ liệu
            mà bạn cho phép mạng xã hội chia sẻ và xử lý dữ liệu đó theo Chính sách này.
          </p>
        </LegalSubsection>
        <LegalSubsection title="3.4. Rút lại sự đồng ý và yêu cầu xử lý">
          <p>
            Bạn có thể yêu cầu dừng sử dụng Dịch vụ, rút lại sự đồng ý, xóa, hạn chế, phản đối hoặc
            chỉnh sửa dữ liệu trong phạm vi pháp luật cho phép. Việc này có thể làm mất hoặc hạn chế
            một số chức năng, quyền lợi hoặc khả năng hỗ trợ Tài khoản.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="4. THU THẬP DỮ LIỆU BỔ SUNG">
        <LegalSubsection title="4.1. Dữ liệu kỹ thuật tự động">
          <p>
            Khi truy cập Dịch vụ, thiết bị của bạn có thể tự động gửi địa chỉ IP, hệ điều hành,
            trình duyệt, loại và thông số thiết bị, mã định danh, URL nguồn, trang hoặc tính năng đã
            sử dụng, thời điểm truy cập, cookie và dữ liệu kỹ thuật tương tự. Nếu bạn đăng nhập, dữ
            liệu có thể được liên kết với hồ sơ Tài khoản; một phần dữ liệu có thể được tổng hợp
            hoặc ẩn danh để phân tích và cải thiện trải nghiệm.
          </p>
        </LegalSubsection>
        <LegalSubsection title="4.2. Dữ liệu vị trí">
          <p>
            Một số tính năng có thể yêu cầu quyền truy cập vị trí chính xác từ GPS, Wi-Fi hoặc nguồn
            tương tự để:
          </p>
          <LegalList>
            <li>Cung cấp tính năng định vị hoặc dịch vụ dựa trên vị trí.</li>
            <li>Cá nhân hóa nội dung và đề xuất.</li>
            <li>Chia sẻ vị trí với người dùng khác khi tính năng cho phép.</li>
            <li>Hỗ trợ quản lý và tối ưu Dịch vụ.</li>
          </LegalList>
          <p>
            Bạn có thể điều chỉnh hoặc tắt quyền truy cập vị trí trong phần cài đặt của thiết bị.
          </p>
        </LegalSubsection>
        <LegalSubsection title="4.3. Dữ liệu phục vụ vận hành">
          <p>
            Hệ thống có thể ghi nhận tự động thông tin về IP, thiết bị, hệ điều hành, phần cứng và
            phần mềm để vận hành, bảo mật, phân tích và nâng cao chất lượng Dịch vụ.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="5. COOKIES VÀ CÔNG NGHỆ TƯƠNG TỰ">
        <LegalSubsection title="5.1. Cách sử dụng cookie">
          <p>
            ZENX GO và các đối tác có thể dùng cookie hoặc công nghệ theo dõi tương tự để ghi nhận,
            phân tích và trong trường hợp phù hợp chia sẻ thông tin về cách bạn truy cập, sử dụng
            Dịch vụ. Cookie có thể được dùng để:
          </p>
          <LegalList>
            <li>Cải thiện hiệu suất và trải nghiệm của website, ứng dụng.</li>
            <li>Đề xuất tính năng hoặc dịch vụ phù hợp hơn.</li>
            <li>Cá nhân hóa nội dung và quảng cáo khi được áp dụng.</li>
            <li>Phân tích hành vi sử dụng để tối ưu sản phẩm.</li>
          </LegalList>
          <p>
            Cookie là tệp dữ liệu nhỏ được lưu trên thiết bị, thường chứa mã định danh và thông tin
            sử dụng. Trong một số trường hợp, dữ liệu cookie có thể được liên kết với Thông tin cá
            nhân để phục vụ hiển thị nội dung và thống kê.
          </p>
        </LegalSubsection>
        <LegalSubsection title="5.2. Quản lý cookie">
          <p>
            Bạn có thể quản lý hoặc từ chối cookie trong cài đặt của trình duyệt hoặc thiết bị. Nếu
            tắt cookie, một số tính năng hoặc Dịch vụ có thể không hoạt động đầy đủ.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="6. CÁCH ZENX GO SỬ DỤNG DỮ LIỆU">
        <LegalSubsection title="6.1. Mục đích xử lý">
          <p>
            ZENX GO có thể thu thập, sử dụng, chia sẻ và xử lý dữ liệu cá nhân cho các mục đích hợp
            pháp sau:
          </p>
          <LegalList>
            <li>
              Cung cấp, vận hành, bảo trì và nâng cấp website, ứng dụng, tài khoản và Dịch vụ.
            </li>
            <li>
              Xử lý giao dịch, thanh toán, đơn hàng và thông báo thay đổi hoặc sự cố liên quan đến
              Tài khoản.
            </li>
            <li>
              Xác thực, KYC, quản lý rủi ro, phòng chống gian lận và điều tra hành vi vi phạm.
            </li>
            <li>Hỗ trợ khách hàng, tiếp nhận khiếu nại và liên hệ quản trị Tài khoản.</li>
            <li>Cho phép Người dùng kết nối và tương tác trong các tính năng được cung cấp.</li>
            <li>Phân tích dữ liệu, khảo sát, nghiên cứu, phát triển và tối ưu sản phẩm.</li>
            <li>
              Thực hiện tiếp thị, quảng bá, khuyến mãi, sự kiện và chương trình truyền thông khi phù
              hợp.
            </li>
            <li>Tuân thủ pháp luật, lập báo cáo nội bộ và đáp ứng yêu cầu của cơ quan nhà nước.</li>
            <li>Lưu trữ, sao lưu, bảo mật dữ liệu và khôi phục Dịch vụ khi xảy ra sự cố.</li>
            <li>
              Hỗ trợ các giao dịch doanh nghiệp như mua bán, sáp nhập, tái cấu trúc hoặc chuyển
              giao.
            </li>
            <li>
              Thực hiện các mục đích hợp pháp khác đã được thông báo khi xin sự chấp thuận cần
              thiết.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="6.2. Trường hợp truy cập, lưu giữ và tiết lộ">
          <p>
            Khi bạn cung cấp dữ liệu và sử dụng Dịch vụ, bạn đồng ý để ZENX GO truy cập, lưu giữ, xử
            lý hoặc tiết lộ dữ liệu trong các trường hợp:
          </p>
          <LegalList>
            <li>Có yêu cầu của pháp luật, tòa án hoặc cơ quan có thẩm quyền.</li>
            <li>Cần thực hiện nghĩa vụ pháp lý hoặc quy trình tố tụng bắt buộc.</li>
            <li>Cần thực thi Điều khoản sử dụng hoặc Chính sách bảo mật.</li>
            <li>Cần xử lý khiếu nại, tranh chấp hoặc nguy cơ xâm phạm quyền lợi của các bên.</li>
            <li>Cần đáp ứng yêu cầu hỗ trợ và bảo vệ an toàn Tài khoản.</li>
            <li>Cần bảo vệ quyền, tài sản và an toàn của ZENX GO, Người dùng hoặc cộng đồng.</li>
          </LegalList>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="7. BẢO VỆ VÀ LƯU TRỮ DỮ LIỆU CÁ NHÂN">
        <LegalSubsection title="7.1. Biện pháp bảo vệ">
          <p>
            ZENX GO áp dụng các biện pháp kỹ thuật và quản trị phù hợp, có thể gồm tường lửa, hệ
            thống bảo mật nhiều lớp và kiểm soát truy cập. Chỉ nhân sự hoặc nhà cung cấp được phân
            quyền mới được truy cập dữ liệu khi cần cho công việc.
          </p>
        </LegalSubsection>
        <LegalSubsection title="7.2. Thời gian lưu trữ">
          <p>
            Dữ liệu cá nhân được lưu trữ trong thời gian cần thiết cho mục đích ban đầu, mục đích
            kinh doanh hợp pháp, nghĩa vụ pháp lý hoặc các mục đích phù hợp khác. ZENX GO có thể
            xóa, hủy hoặc ẩn danh dữ liệu khi:
          </p>
          <LegalList>
            <li>Nhận được yêu cầu hợp lệ từ bạn.</li>
            <li>Dữ liệu không còn cần cho mục đích đã thu thập.</li>
            <li>Dữ liệu không còn phục vụ mục tiêu kinh doanh hợp pháp.</li>
            <li>Không còn lợi ích hợp pháp khác cần tiếp tục lưu giữ dữ liệu.</li>
          </LegalList>
          <p>
            Ngay cả khi bạn ngừng sử dụng Dịch vụ hoặc Tài khoản bị chấm dứt, ZENX GO vẫn có thể lưu
            giữ, sử dụng hoặc chia sẻ dữ liệu theo Chính sách này và quy định pháp luật. Trong một
            số trường hợp, việc xóa có thể được thực hiện mà không cần thông báo trước.
          </p>
        </LegalSubsection>
        <LegalSubsection title="7.3. Trường hợp có thể từ chối xóa dữ liệu">
          <p>ZENX GO có thể từ chối yêu cầu xóa dữ liệu nếu:</p>
          <LegalList>
            <li>Yêu cầu đó trái quy định pháp luật.</li>
            <li>Việc xóa tạo rủi ro cho hệ thống, Dịch vụ, đối tác hoặc Người dùng khác.</li>
            <li>Yêu cầu bị đánh giá là nhằm gian lận, gây hại hoặc trái với lợi ích chính đáng.</li>
          </LegalList>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="8. CHIA SẺ VÀ TIẾT LỘ DỮ LIỆU CÁ NHÂN">
        <LegalSubsection title="8.1. Các bên có thể nhận dữ liệu">
          <p>Trong quá trình cung cấp Dịch vụ, ZENX GO có thể chia sẻ dữ liệu cá nhân với:</p>
          <LegalList>
            <li>Công ty mẹ, công ty con, đơn vị liên kết hoặc đối tác chiến lược, nếu có.</li>
            <li>Người dùng khác khi tính năng tương ứng cho phép hiển thị hoặc tương tác.</li>
            <li>
              Nhà thầu, đại lý và nhà cung cấp dịch vụ như viễn thông, trung tâm dữ liệu, thanh
              toán, công nghệ thông tin, quảng cáo hoặc truyền thông.
            </li>
            <li>Cơ quan nhà nước có thẩm quyền.</li>
            <li>
              Đối tác hoặc bên nhận chuyển giao trong giao dịch mua bán, sáp nhập, tái cấu trúc hoặc
              thanh lý.
            </li>
            <li>Bên thứ ba hợp pháp khác cho mục đích đã được thông báo.</li>
          </LegalList>
          <p>
            Các bên nhận dữ liệu phải áp dụng biện pháp bảo mật phù hợp và chỉ lưu giữ dữ liệu trong
            thời gian cần thiết cho mục đích đã xác định hoặc theo pháp luật.
          </p>
        </LegalSubsection>
        <LegalSubsection title="8.2. Dữ liệu tổng hợp">
          <p>
            ZENX GO có thể chia sẻ dữ liệu thống kê, nhân khẩu học hoặc hành vi sử dụng ở dạng tổng
            hợp, không định danh, cho đối tác hoặc đơn vị nghiên cứu để phân tích và cải thiện Dịch
            vụ.
          </p>
        </LegalSubsection>
        <LegalSubsection title="8.3. Xử lý không cần sự đồng ý trong một số trường hợp">
          <p>
            Trong phạm vi pháp luật cho phép, ZENX GO có thể thu thập, sử dụng hoặc tiết lộ dữ liệu
            mà không cần xin thêm sự đồng ý nếu việc đó nhằm:
          </p>
          <LegalList>
            <li>Thực hiện nghĩa vụ pháp lý.</li>
            <li>Thực hiện hợp đồng hoặc cung cấp Dịch vụ đã yêu cầu.</li>
            <li>
              Bảo vệ lợi ích hợp pháp của ZENX GO mà không xâm phạm quá mức quyền bảo vệ dữ liệu của
              bạn.
            </li>
            <li>Đáp ứng yêu cầu pháp lý hoặc quy định bắt buộc.</li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="8.4. Giới hạn an toàn">
          <p>
            Dù đã áp dụng biện pháp bảo mật phù hợp, không hệ thống nào có thể an toàn tuyệt đối.
            Vẫn có thể xảy ra truy cập trái phép, tấn công mạng hoặc sự cố kỹ thuật nằm ngoài khả
            năng kiểm soát hợp lý.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="9. THÔNG TIN VỀ TRẺ EM">
        <p>
          ZENX GO tôn trọng và bảo vệ quyền riêng tư của trẻ em. Chúng tôi không chủ động thu thập
          dữ liệu cá nhân của người dưới 16 tuổi nếu không có sự chấp thuận hợp pháp của cha mẹ hoặc
          người giám hộ.
        </p>
        <p>
          Cha mẹ hoặc người giám hộ phải giám sát việc trẻ sử dụng Dịch vụ và chịu trách nhiệm về
          thông tin đã cung cấp, bao gồm:
        </p>
        <LegalList>
          <li>Đồng ý để ZENX GO thu thập, xử lý và sử dụng dữ liệu của trẻ theo Chính sách này.</li>
          <li>Thay mặt trẻ chấp nhận các điều khoản sử dụng và quy định bảo mật liên quan.</li>
        </LegalList>
        <p>
          Nếu phát hiện dữ liệu của trẻ được cung cấp mà không có sự chấp thuận hợp lệ, ZENX GO có
          thể xóa hoặc ẩn danh dữ liệu theo quy định pháp luật.
        </p>
      </LegalSection>

      <LegalSection title="10. DỮ LIỆU DO BÊN THỨ BA THU THẬP">
        <LegalSubsection title="10.1. Dịch vụ tích hợp">
          <p>
            Một số dịch vụ, tính năng hoặc nội dung trên ZENX GO có thể do đối tác hoặc nhà cung cấp
            bên thứ ba triển khai, vận hành hoặc tích hợp, chẳng hạn quảng cáo, phân tích, đăng nhập
            mạng xã hội và phương thức thanh toán. Khi dùng các dịch vụ này, dữ liệu cá nhân có thể
            được bên thứ ba trực tiếp thu thập, lưu trữ hoặc xử lý theo chính sách riêng của họ.
          </p>
        </LegalSubsection>
        <LegalSubsection title="10.2. Trách nhiệm của bên thứ ba">
          <p>
            ZENX GO cố gắng lựa chọn đối tác và nhà cung cấp uy tín nhưng không kiểm soát toàn bộ
            cách bên thứ ba thu thập, xử lý hoặc bảo mật dữ liệu. Bạn nên đọc chính sách của các bên
            liên quan trước khi sử dụng dịch vụ hoặc cung cấp thông tin.
          </p>
        </LegalSubsection>
        <LegalSubsection title="10.3. Yêu cầu hỗ trợ">
          <p>
            Nếu có nghi ngờ, khiếu nại hoặc phát hiện vi phạm liên quan đến dữ liệu do bên thứ ba xử
            lý, bạn nên liên hệ trực tiếp với bên đó hoặc thông báo cho ZENX GO để được hỗ trợ trong
            phạm vi phù hợp.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="11. LOẠI TRỪ TRÁCH NHIỆM ĐỐI VỚI BẢO MẬT CỦA BÊN THỨ BA">
        <p>
          ZENX GO bảo vệ dữ liệu trong hệ thống do mình trực tiếp vận hành bằng các lớp kiểm soát và
          chỉ cho phép nhân sự được ủy quyền truy cập. Tuy nhiên, chúng tôi không thể bảo đảm tuyệt
          đối an toàn của dữ liệu trên nền tảng hoặc máy chủ thuộc bên thứ ba.
        </p>
        <p>
          Dịch vụ có thể chứa liên kết đến website hoặc ứng dụng bên ngoài có chính sách bảo mật
          riêng. Việc ZENX GO hợp tác hoặc cung cấp liên kết không đồng nghĩa với việc chúng tôi
          kiểm soát cách bên thứ ba thu thập và xử lý dữ liệu.
        </p>
        <p>
          Các liên kết được cung cấp để thuận tiện; Người dùng tự chịu trách nhiệm khi truy cập và
          sử dụng dịch vụ bên ngoài. ZENX GO không chịu trách nhiệm pháp lý về nội dung hoặc hoạt
          động bảo mật của bên thứ ba ngoài phạm vi Dịch vụ do chúng tôi trực tiếp vận hành và kiểm
          soát.
        </p>
      </LegalSection>

      <LegalSection title="12. CHUYỂN DỮ LIỆU CÁ NHÂN RA NƯỚC NGOÀI">
        <p>
          Dữ liệu cá nhân có thể được chuyển, lưu trữ hoặc xử lý ngoài Việt Nam để thực hiện các mục
          đích nêu trong Chính sách, chẳng hạn:
        </p>
        <LegalList>
          <li>Sử dụng máy chủ hoặc dịch vụ lưu trữ đặt ngoài Việt Nam.</li>
          <li>Hợp tác với đối tác, nhà cung cấp hoặc công ty liên kết ở nước ngoài.</li>
          <li>Cung cấp Dịch vụ, hỗ trợ kỹ thuật hoặc xử lý giao dịch khi cần thiết.</li>
        </LegalList>
        <p>
          ZENX GO chỉ chuyển dữ liệu ra nước ngoài trong phạm vi pháp luật Việt Nam cho phép và áp
          dụng biện pháp phù hợp để ngăn truy cập, sử dụng, tiết lộ hoặc xử lý trái phép.
        </p>
      </LegalSection>

      <LegalSection title="13. QUYỀN CỦA NGƯỜI DÙNG ĐỐI VỚI DỮ LIỆU CÁ NHÂN">
        <LegalSubsection title="13.1. Các quyền cơ bản">
          <p>
            Trong phạm vi pháp luật cho phép, Người dùng có thể thực hiện các yêu cầu liên quan đến
            dữ liệu cá nhân của mình, bao gồm:
          </p>
          <LegalList>
            <li>Yêu cầu truy cập, xem hoặc nhận bản sao dữ liệu cá nhân.</li>
            <li>Yêu cầu chỉnh sửa, cập nhật hoặc bổ sung dữ liệu chưa đầy đủ, chưa chính xác.</li>
            <li>Yêu cầu xóa, ẩn danh hoặc hạn chế xử lý dữ liệu.</li>
            <li>Yêu cầu rút lại sự đồng ý cho việc xử lý dữ liệu.</li>
            <li>
              Phản đối hoặc hạn chế hoạt động xử lý có thể ảnh hưởng đến quyền và lợi ích hợp pháp.
            </li>
            <li>Yêu cầu giải thích về hoạt động xử lý dữ liệu cá nhân.</li>
            <li>Yêu cầu thông tin về bên thứ ba đã hoặc sẽ nhận dữ liệu cá nhân.</li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="13.2. Cách gửi yêu cầu">
          <p>
            Bạn có thể gửi yêu cầu thực hiện quyền liên quan đến dữ liệu cá nhân qua kênh hỗ trợ của
            ZENX GO hoặc theo hướng dẫn cụ thể của từng Dịch vụ.
          </p>
        </LegalSubsection>
        <LegalSubsection title="13.3. Tiếp nhận và xác minh">
          <p>
            ZENX GO sẽ tiếp nhận, xác minh và xử lý yêu cầu theo quy định pháp luật. Một số yêu cầu
            có thể bị từ chối nếu trái pháp luật, không thể xác minh hoặc ảnh hưởng đến quyền lợi
            hợp pháp của ZENX GO, Người dùng khác hay bên thứ ba.
          </p>
        </LegalSubsection>
        <LegalSubsection title="13.4. Ảnh hưởng đến Dịch vụ">
          <p>
            Việc thực hiện các quyền trên có thể ảnh hưởng đến trải nghiệm, khả năng khôi phục Tài
            khoản hoặc quyền sử dụng một số tính năng liên quan.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="14. THẮC MẮC, YÊU CẦU HỖ TRỢ HOẶC KHIẾU NẠI">
        <p>
          Nếu bạn có câu hỏi, yêu cầu thực hiện quyền riêng tư hoặc khiếu nại về việc thu thập, sử
          dụng và bảo vệ dữ liệu cá nhân, vui lòng liên hệ ZENX GO qua:
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-semibold text-slate-800">ZENX GO</p>
          <p>
            Email:{' '}
            <a
              className="font-semibold text-[#00873E] hover:underline"
              href="mailto:support@zenxgo.vn"
            >
              support@zenxgo.vn
            </a>
          </p>
        </div>
        <p>
          ZENX GO sẽ tiếp nhận và xử lý yêu cầu theo quy định pháp luật và Chính sách bảo mật hiện
          hành.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
