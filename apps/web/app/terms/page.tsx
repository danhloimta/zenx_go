import type { Metadata } from 'next';
import { LegalList, LegalPage, LegalSection, LegalSubsection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản sử dụng dịch vụ ZENX GO và ví ZENX Coin.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản sử dụng"
      description="Vui lòng đọc kỹ các điều khoản dưới đây trước khi đăng ký hoặc sử dụng tài khoản, ví ZENX Coin và các dịch vụ của ZENX GO."
    >
      <LegalSection title="1. GIỚI THIỆU CHUNG">
        <p>
          Điều khoản sử dụng này là thỏa thuận pháp lý giữa ZENX GO và người sử dụng các dịch vụ của
          ZENX GO (sau đây gọi là “Người dùng”). Dịch vụ bao gồm cổng tài khoản, ví ZENX Coin,
          website, ứng dụng, công cụ và các sản phẩm liên quan do ZENX GO cung cấp.
        </p>
      </LegalSection>

      <LegalSection title="2. ĐỊNH NGHĨA">
        <p>
          <strong>2.1. “Dịch vụ”</strong> là website, ứng dụng, tài khoản, ví ZENX Coin và các dịch
          vụ liên quan do ZENX GO vận hành, bao gồm cả bản cập nhật, nâng cấp, tính năng bổ sung và
          tiện ích đi kèm.
        </p>
        <p>
          <strong>2.2. “Người dùng”</strong> là cá nhân hoặc tổ chức đăng ký, truy cập hay sử dụng
          bất kỳ Dịch vụ nào của ZENX GO.
        </p>
        <p>
          <strong>2.3. “Tài khoản” hoặc “ZENX GO ID”</strong> là tập hợp thông tin dùng để nhận diện
          Người dùng và xác thực quyền truy cập vào Dịch vụ.
        </p>
        <p>
          <strong>2.4. “Nội dung”</strong> gồm văn bản, hình ảnh, âm thanh, hình động, video, phần
          mềm, thiết kế, cơ sở dữ liệu và các tài nguyên khác liên quan đến Dịch vụ.
        </p>
        <p>
          <strong>2.5. “ZENX Coin”</strong> là đơn vị tiền tệ ảo được sử dụng trong hệ thống ZENX GO
          cho các giao dịch được hỗ trợ. ZENX Coin không phải tiền tệ pháp định và không có giá trị
          quy đổi thành tiền mặt hoặc tài sản khác, trừ khi ZENX GO có thông báo chính thức khác phù
          hợp với pháp luật.
        </p>
        <p>
          <strong>2.6. “Thông tin cá nhân”</strong> là thông tin Người dùng cung cấp hoặc thông tin
          có thể được liên kết với Người dùng trong quá trình đăng ký và sử dụng Dịch vụ.
        </p>
      </LegalSection>

      <LegalSection title="3. CHẤP THUẬN VÀ THAY ĐỔI ĐIỀU KHOẢN">
        <LegalSubsection title="3.1. Chấp thuận điều khoản">
          <p>
            Khi đăng ký tài khoản, truy cập hoặc tiếp tục sử dụng Dịch vụ, Người dùng xác nhận đã
            đọc, hiểu và đồng ý với Điều khoản sử dụng này cùng các chính sách liên quan. Nếu không
            đồng ý với bất kỳ nội dung nào, Người dùng cần ngừng truy cập và sử dụng Dịch vụ.
          </p>
        </LegalSubsection>
        <LegalSubsection title="3.2. Hiệu lực và phạm vi áp dụng">
          <LegalList>
            <li>
              <strong>Hiệu lực:</strong> Điều khoản có hiệu lực từ thời điểm Người dùng chấp thuận
              hoặc bắt đầu sử dụng Dịch vụ.
            </li>
            <li>
              <strong>Phạm vi:</strong> Điều khoản áp dụng cho toàn bộ Dịch vụ hiện có và được cung
              cấp sau này. Một số sản phẩm có thể có điều khoản riêng; nếu có khác biệt, điều khoản
              riêng của sản phẩm đó được ưu tiên áp dụng trong phạm vi liên quan.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="3.3. Thay đổi và cập nhật điều khoản">
          <LegalList>
            <li>
              ZENX GO có thể sửa đổi, bổ sung, thay thế hoặc loại bỏ một phần Điều khoản khi cần
              thiết.
            </li>
            <li>
              Phiên bản cập nhật sẽ được đăng trên các kênh chính thức của ZENX GO. Việc thông báo
              có thể không được gửi riêng đến từng Người dùng.
            </li>
            <li>
              Người dùng có trách nhiệm kiểm tra các thay đổi. Việc tiếp tục sử dụng Dịch vụ sau khi
              phiên bản mới được công bố được xem là chấp thuận nội dung cập nhật. Nếu không đồng ý,
              Người dùng cần ngừng sử dụng và có thể yêu cầu đóng Tài khoản.
            </li>
          </LegalList>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="4. TÀI KHOẢN NGƯỜI DÙNG">
        <LegalSubsection title="4.1. Đăng ký và quản lý tài khoản">
          <p>
            Để sử dụng một số Dịch vụ, Người dùng cần đăng ký Tài khoản và cung cấp thông tin chính
            xác, đầy đủ, hợp pháp theo yêu cầu của hệ thống.
          </p>
          <LegalList>
            <li>
              <strong>Thông tin đăng ký:</strong> có thể gồm họ tên, ngày sinh, số điện thoại, địa
              chỉ email và các thông tin khác cần cho việc tạo hoặc xác minh Tài khoản.
            </li>
            <li>
              <strong>Mục đích sử dụng:</strong> ZENX GO sử dụng thông tin để xác minh danh tính, hỗ
              trợ giải quyết tranh chấp, khôi phục quyền truy cập và bảo đảm an toàn cho giao dịch.
              ZENX GO có thể từ chối xử lý khiếu nại nếu thông tin đăng ký sai hoặc không đầy đủ.
            </li>
            <li>
              <strong>Cập nhật thông tin:</strong> Người dùng phải chủ động cập nhật thông tin khi
              có thay đổi để bảo đảm dữ liệu trong Tài khoản luôn chính xác.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="4.2. Quy định về tên tài khoản">
          <p>
            Tên tài khoản không được chứa từ ngữ phản cảm, phân biệt đối xử, xúc phạm tôn giáo, xâm
            phạm quyền của người khác hoặc vi phạm pháp luật. ZENX GO có quyền đổi tên, hạn chế hoặc
            khóa Tài khoản vi phạm mà không cần báo trước trong trường hợp cần thiết.
          </p>
        </LegalSubsection>
        <LegalSubsection title="4.3. Bảo mật tài khoản và trách nhiệm của Người dùng">
          <LegalList>
            <li>
              Người dùng chịu trách nhiệm bảo mật tên đăng nhập, mật khẩu, mã xác thực và các thông
              tin bảo vệ khác; không nên chia sẻ chúng hoặc đăng nhập trên thiết bị công cộng, không
              đáng tin cậy.
            </li>
            <li>
              Người dùng phải thông báo ngay cho ZENX GO nếu phát hiện Tài khoản bị truy cập trái
              phép, bị đánh cắp hoặc bị sử dụng sai mục đích.
            </li>
            <li>
              ZENX GO không chịu trách nhiệm cho thiệt hại phát sinh từ việc Người dùng để lộ thông
              tin, sử dụng mật khẩu dễ đoán hoặc có hành vi bất cẩn khác.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="4.4. Trạng thái tài khoản">
          <LegalList>
            <li>
              <strong>Tài khoản mới:</strong> Tài khoản vừa được tạo và chưa hoàn tất xác minh.
            </li>
            <li>
              <strong>Tài khoản đã kích hoạt:</strong> Tài khoản đã đáp ứng yêu cầu xác minh và được
              sử dụng các tính năng tương ứng.
            </li>
            <li>
              <strong>Tài khoản không hoạt động:</strong> ZENX GO có thể tạm khóa hoặc xóa Tài khoản
              không có hoạt động đăng nhập trong một khoảng thời gian liên tục, chẳng hạn 12 tháng.
              Dữ liệu liên quan có thể được xóa hoặc ẩn danh theo quy định áp dụng.
            </li>
          </LegalList>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="5. ĐIỀU KHOẢN VỀ THANH TOÁN">
        <LegalSubsection title="5.1. Đơn vị tiền tệ">
          <LegalList>
            <li>
              <strong>Đơn vị chính thức:</strong> ZENX Coin là đơn vị tiền tệ ảo được sử dụng cho
              các tính năng và giao dịch mà ZENX GO hỗ trợ.
            </li>
            <li>
              <strong>Giá trị quy đổi:</strong> tỷ lệ giữa tiền thật và ZENX Coin, nếu có, sẽ được
              công bố trên kênh chính thức và có thể thay đổi theo từng thời điểm.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="5.2. Nạp ZENX Coin">
          <LegalList>
            <li>
              Người dùng chỉ được nạp ZENX Coin qua các phương thức thanh toán chính thức được ZENX
              GO công bố, chẳng hạn chuyển khoản ngân hàng/VietQR hoặc phương thức khác được hỗ trợ.
            </li>
            <li>
              Người dùng phải tuân thủ hướng dẫn thanh toán và tự kiểm tra thông tin trước khi xác
              nhận. ZENX GO không chịu trách nhiệm cho lỗi nhập liệu hoặc lỗi phát sinh từ nhà cung
              cấp thanh toán.
            </li>
            <li>
              Giao dịch chỉ được xem là hoàn tất khi ZENX Coin đã được ghi nhận vào đúng Tài khoản.
              Người dùng nên kiểm tra số dư sau mỗi lần nạp.
            </li>
          </LegalList>
        </LegalSubsection>
        <p>
          <strong>5.3. Nguyên tắc không hoàn lại:</strong> giao dịch nạp ZENX Coin đã thành công
          không được hoàn lại, trừ khi xác định có lỗi kỹ thuật nghiêm trọng từ hệ thống ZENX GO
          hoặc trường hợp pháp luật bắt buộc khác. Người dùng phải kiểm tra thông tin giao dịch
          trước khi thanh toán.
        </p>
        <p>
          <strong>5.4. Bảo mật giao dịch:</strong> ZENX GO áp dụng biện pháp bảo vệ thông tin giao
          dịch nhưng không chịu trách nhiệm về việc mất ZENX Coin do lỗi của Người dùng, sử dụng
          công cụ gian lận, để lộ thông tin hoặc giao dịch qua website không chính thức.
        </p>
        <p>
          <strong>5.5. Lịch sử giao dịch:</strong> ZENX GO lưu trữ lịch sử giao dịch trong khoảng
          thời gian phù hợp với mục đích vận hành và quy định áp dụng. Người dùng có thể xem lịch sử
          trong phần quản lý Tài khoản khi tính năng được cung cấp.
        </p>
        <p>
          <strong>5.6. Khiếu nại giao dịch:</strong> khiếu nại liên quan đến thanh toán phải được
          gửi qua kênh hỗ trợ chính thức trong vòng 30 ngày kể từ khi giao dịch phát sinh. ZENX GO
          có thể từ chối khiếu nại gửi quá thời hạn này.
        </p>
        <p>
          <strong>5.7. Người dùng chưa thành niên:</strong> Người dùng dưới 18 tuổi phải có sự đồng
          ý và giám sát của cha mẹ hoặc người giám hộ hợp pháp khi thực hiện thanh toán. ZENX GO có
          thể yêu cầu bằng chứng về sự đồng ý đó khi cần thiết.
        </p>
      </LegalSection>

      <LegalSection title="6. SỬ DỤNG DỊCH VỤ VÀ QUY ĐỊNH HÀNH VI">
        <p>
          <strong>6.1. Tuân thủ pháp luật:</strong> Người dùng cam kết không sử dụng Dịch vụ cho mục
          đích bất hợp pháp hoặc vi phạm pháp luật Việt Nam.
        </p>
        <LegalSubsection title="6.2. Hành vi bị cấm">
          <p>
            Người dùng không được thực hiện các hành vi gây ảnh hưởng đến Dịch vụ hoặc cộng đồng,
            bao gồm:
          </p>
          <LegalList>
            <li>Sử dụng công cụ, phần mềm hoặc phương thức trái phép để can thiệp vào hệ thống.</li>
            <li>Phát tán virus, mã độc, thư rác hoặc nội dung gây hại.</li>
            <li>Gian lận, khai thác lỗi hoặc lợi dụng Dịch vụ để trục lợi.</li>
            <li>Xúc phạm, đe dọa, quấy rối, gây mất đoàn kết hoặc xâm phạm người dùng khác.</li>
            <li>
              Quảng cáo, mua bán sản phẩm/dịch vụ trái phép; trao đổi Tài khoản hoặc ZENX Coin bằng
              tiền mặt hay tài sản ngoài hệ thống nếu chưa được ZENX GO cho phép.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="6.3. Nội dung do Người dùng tạo và chính sách không khoan nhượng">
          <p>
            Một số Dịch vụ có thể cho phép Người dùng tạo hoặc chia sẻ nội dung như tin nhắn, tên
            hiển thị hoặc nội dung tương tác. Khi sử dụng các tính năng này, Người dùng đồng ý rằng:
          </p>
          <LegalList>
            <li>
              ZENX GO áp dụng chính sách không khoan nhượng đối với nội dung khiêu dâm, bạo lực, thù
              ghét, phân biệt đối xử, xúc phạm, đe dọa, quấy rối, spam hoặc lừa đảo.
            </li>
            <li>
              Nội dung có thể được lọc tự động. Người dùng có thể báo cáo nội dung vi phạm và chặn
              tài khoản lạm dụng bằng tính năng được cung cấp; nội dung của tài khoản bị chặn sẽ
              không còn hiển thị với Người dùng trong phạm vi tính năng hỗ trợ.
            </li>
            <li>
              ZENX GO sẽ xem xét báo cáo và cố gắng xử lý trong vòng 24 giờ kể từ khi tiếp nhận, bao
              gồm gỡ nội dung và áp dụng biện pháp phù hợp như cấm tương tác, khóa tạm thời hoặc
              khóa vĩnh viễn.
            </li>
          </LegalList>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="7. QUYỀN VÀ TRÁCH NHIỆM CỦA ZENX GO">
        <LegalSubsection title="7.1. Quản lý và cung cấp dịch vụ">
          <LegalList>
            <li>
              <strong>Giám sát và kiểm tra:</strong> ZENX GO có thể giám sát, kiểm tra và ghi nhận
              hoạt động sử dụng Dịch vụ để phát hiện, ngăn chặn và xử lý vi phạm.
            </li>
            <li>
              <strong>Thay đổi và nâng cấp:</strong> ZENX GO có thể thay đổi, bảo trì hoặc tạm ngừng
              một phần Dịch vụ để vận hành, tối ưu hay phát triển sản phẩm. Việc này có thể ảnh
              hưởng tạm thời đến trải nghiệm sử dụng.
            </li>
            <li>
              <strong>Đình chỉ:</strong> ZENX GO có quyền đình chỉ, tạm ngừng hoặc chấm dứt Dịch vụ
              đối với Người dùng khi có cơ sở hợp lý cho rằng Điều khoản đã bị vi phạm.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="7.2. Xử lý vi phạm">
          <LegalList>
            <li>Cảnh cáo hoặc nhắc nhở qua email, trong hệ thống hoặc kênh liên lạc phù hợp.</li>
            <li>
              Tạm khóa Tài khoản và hạn chế quyền truy cập trong một khoảng thời gian nhất định.
            </li>
            <li>Khóa vĩnh viễn Tài khoản và chấm dứt quyền sử dụng Dịch vụ.</li>
            <li>
              Xóa hoặc ẩn danh Tài khoản, dữ liệu, vật phẩm ảo, ZENX Coin và tài sản liên quan theo
              quy định áp dụng.
            </li>
            <li>
              ZENX GO không chịu trách nhiệm bồi thường cho thiệt hại, mất mát phát sinh từ biện
              pháp xử lý vi phạm được thực hiện phù hợp với Điều khoản và pháp luật.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="7.3. Bảo mật và bảo vệ thông tin">
          <LegalList>
            <li>
              ZENX GO bảo vệ Thông tin cá nhân theo Chính sách bảo mật và áp dụng các biện pháp kỹ
              thuật, tổ chức phù hợp để hạn chế truy cập, sử dụng hoặc tiết lộ trái phép.
            </li>
            <li>
              ZENX GO không chịu trách nhiệm cho việc thông tin bị tiết lộ do Người dùng tự chia sẻ,
              sự cố tấn công từ bên ngoài, bất khả kháng hoặc lỗi của nhà cung cấp dịch vụ thứ ba.
            </li>
            <li>
              ZENX GO có thể cung cấp thông tin cho cơ quan có thẩm quyền khi có yêu cầu hợp pháp
              phục vụ điều tra, truy tố hoặc tuân thủ pháp luật.
            </li>
          </LegalList>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="8. CHÍNH SÁCH GIẢI QUYẾT KHIẾU NẠI">
        <LegalSubsection title="8.1. Kênh tiếp nhận và thông tin cần cung cấp">
          <p>
            Khiếu nại phải được gửi qua kênh hỗ trợ chính thức của ZENX GO. Để được xử lý nhanh
            chóng, Người dùng nên cung cấp:
          </p>
          <LegalList>
            <li>Tên tài khoản (ZENX GO ID) và tên hiển thị liên quan, nếu có.</li>
            <li>Mô tả rõ sự việc, thời gian và nơi phát sinh vấn đề.</li>
            <li>Bằng chứng phù hợp như hình ảnh, video hoặc lịch sử giao dịch.</li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="8.2. Thời hạn và nguyên tắc giải quyết">
          <LegalList>
            <li>
              ZENX GO chỉ tiếp nhận khiếu nại trong vòng 30 ngày kể từ khi sự việc phát sinh và có
              thể từ chối khiếu nại quá thời hạn.
            </li>
            <li>
              Khiếu nại được xem xét dựa trên thông tin Người dùng cung cấp và dữ liệu có trong hệ
              thống. ZENX GO có thể không giải quyết khi bằng chứng không rõ ràng hoặc đến từ nguồn
              không chính thống.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="8.3. Khiếu nại liên quan đến thanh toán">
          <LegalList>
            <li>
              ZENX GO có thể yêu cầu mã giao dịch, chứng từ ngân hàng/ví điện tử hoặc bằng chứng hợp
              lệ khác để xác minh.
            </li>
            <li>
              Nếu xác định lỗi thuộc hệ thống ZENX GO, chẳng hạn đã trừ tiền nhưng chưa nhận ZENX
              Coin, ZENX GO sẽ xử lý và hoàn trả giá trị tương ứng theo quy trình áp dụng.
            </li>
          </LegalList>
        </LegalSubsection>
        <LegalSubsection title="8.4. Quyền của ZENX GO khi giải quyết khiếu nại">
          <LegalList>
            <li>
              ZENX GO có quyền đưa ra kết luận cuối cùng dựa trên dữ liệu và quy định áp dụng.
            </li>
            <li>
              ZENX GO có thể từ chối khiếu nại nếu Người dùng gian lận, cung cấp thông tin sai lệch
              hoặc làm giả bằng chứng.
            </li>
          </LegalList>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="9. ĐIỀU KHOẢN CUỐI CÙNG">
        <p>
          <strong>9.1. Thỏa thuận độc lập:</strong> nếu một điều khoản bị xác định là vô hiệu hoặc
          không thể thi hành, các điều khoản còn lại vẫn giữ nguyên hiệu lực trong phạm vi pháp luật
          cho phép.
        </p>
        <p>
          <strong>9.2. Luật áp dụng:</strong> Điều khoản được điều chỉnh và giải thích theo pháp
          luật Việt Nam. Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết bằng thương lượng; nếu
          thương lượng không thành, tranh chấp được đưa ra cơ quan tài phán có thẩm quyền.
        </p>
        <p>Cảm ơn Người dùng đã đọc và tuân thủ Điều khoản sử dụng của ZENX GO.</p>
      </LegalSection>
    </LegalPage>
  );
}
