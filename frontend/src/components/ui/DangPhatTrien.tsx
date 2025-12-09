export default function DangPhatTrien({ title }: { title: string }) {
  return (
    <div className="khung-dang-phat-trien" style={{ padding: '20px', textAlign: 'center' }}>
      <p className="nhan-dang-phat-trien" style={{
        display: 'inline-block',
        padding: '5px 15px',
        backgroundColor: '#ffc107',
        borderRadius: '15px',
        fontWeight: 'bold',
        color: '#333'
      }}>Đang phát triển</p>
      <h2 className="tieu-de-dang-phat-trien" style={{ marginTop: '10px', fontSize: '2rem' }}>{title}</h2>
      <p className="mo-ta-dang-phat-trien" style={{ marginTop: '10px', color: '#666' }}>
        Tính năng cho mục này sẽ sớm được hoàn thiện. Vui lòng quay lại sau.
      </p>
    </div>
  );
}
