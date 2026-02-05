# Hibrit Film & Dizi Öneri Sistemi Tasarımı (Üretim Odaklı)

Bu doküman, web uygulaması için uçtan uca **hibrit bir film/dizi öneri sistemi** tasarımını özetler. Amaç, **yüksek doğruluk**, **ölçeklenebilirlik** ve **üretime uygunluk** sağlayan bir mimariyi; içerik tabanlı, işbirlikçi, bilgi tabanlı ve derin öğrenme yaklaşımlarını **dengeleyerek** birleştirmektir.

---

## 1) Genel Mimari

### 1.1 Veri Akışı (Pipeline)

**Offline (Batch) Katmanı**
1. **Veri Toplama**: Kullanıcı oylamaları, izleme geçmişi (timestamp), içerik açıklamaları (özet, tür, oyuncu, yönetmen, etiket), meta veriler (yıl, süre, ülke, dil).
2. **Özellik Mühendisliği**:
   - Metin özellikleri (TF-IDF / Sentence-BERT embedding)
   - Kategorik özellikler (tür, ülke) için one-hot / embedding
   - İzleme geçmişinden sıralı oturum özellikleri (session windows)
3. **Model Eğitimi**:
   - CF (ALS/implicit MF)
   - Content embeddings
   - Neural CF / Sequence-aware model
4. **Model Birleştirme (Ensemble/Fusion)**
5. **Model/Feature Store** (ör. Feast + S3)

**Online (Serving) Katmanı**
1. **Gerçek zamanlı sinyal** (son izlemeler, tıklamalar)
2. **Aday üretimi** (recall) + **yeniden sıralama** (ranking)
3. **Cache & düşük gecikme** (Redis/KeyDB)

### 1.2 Katmanlar
- **Candidate Generation (Recall)**: Hızlı ve geniş aday listesi (ör. 500-2000 öğe)
- **Ranking**: Derin/hibrit model ile nihai sıralama (ör. top-50)
- **Re-ranking/Business Rules**: çeşitlilik, tazelik, ebeveyn kısıtları, editor picks

### 1.3 Online/Offline Ayrımı
- **Offline**: ağır eğitim, embedding güncellemeleri, toplu inference
- **Online**: hafif feature hesaplama + hızlı skorlama

---

## 2) Model Tasarımı

### 2.1 Yöntemlerin Rolü
1. **İçerik Tabanlı (Content)**
   - Yeni içerik (cold-start) için temel sinyal.
   - NLP embedding (Sentence-BERT) + meta veri embedding.

2. **İşbirlikçi (CF/MF)**
   - Kullanıcı benzerliği ve etkileşimli pattern yakalama.
   - Implicit feedback (izleme süreleri) için ALS/implicit MF.

3. **Bilgi Tabanlı (Rule/Knowledge)**
   - Soğuk başlangıç: kullanıcı tercihlerine dayalı kural tabanı (ör. “sadece Türkçe, 2020+”).
   - İçerik kısıtları: yaş sınırı, ülke, dil, bölüm sayısı.

4. **Derin Öğrenme**
   - Neural CF (embedding + MLP) ile nonlinear etkileşim.
   - Sequence-aware model (Transformer/RNN) ile oturum/sıralı izleme davranışı.

### 2.2 Hibritleştirme Stratejisi

**İki aşamalı (Recall + Ranking)**
- **Recall**: CF + Content embedding + Popülerlik tabanlı adaylar
- **Ranking**: Neural model + feature fusion

**Late Fusion (Weighted Ensemble)**
- Final skor = `w1*CF + w2*Content + w3*Sequence + w4*BusinessRule`
- Ağırlıklar: offline grid search + online A/B ile optimize edilir.

**Örnek Pseudocode**

```pseudo
candidate_pool = union(
  recall_cf(user_id),
  recall_content(user_profile),
  recall_popular(region, time_window)
)

features = build_features(user_id, candidate_pool)
rank_scores = neural_ranker(features)

final_scores = w1*rank_scores + w2*rule_boost(features)
result = diversify_and_filter(final_scores)
return top_k(result)
```

---

## 3) Algoritma & Teknoloji Önerileri

### 3.1 Python Ekosistemi
- **Veri/ETL**: Pandas, PySpark, Airflow
- **Feature Store**: Feast
- **Model Eğitimi**:
  - CF: `implicit` (ALS), `surprise` (SVD), `lightfm`
  - NLP: `sentence-transformers`, `scikit-learn` (TF-IDF)
  - Deep: `PyTorch`, `TensorFlow`
- **Serving**: FastAPI, TorchServe / Triton
- **Cache**: Redis
- **Monitoring**: Evidently, Prometheus + Grafana

### 3.2 Embedding & Model Seçenekleri
- Content embedding: `all-MiniLM-L6-v2` (Sentence-BERT) veya domain-specific LLM embeddings
- Sequence model: Transformer (SASRec / BERT4Rec)
- Ranking model: DNN + attention-based fusion

---

## 4) Değerlendirme Metrikleri

**Offline**
- Precision@K
- Recall@K
- NDCG@K
- MRR

**Online (A/B Test)**
- CTR, izleme süresi, geri dönüş oranı
- **Guardrail**: bounce rate, latency

**A/B Test Stratejisi**
1. Yeni model %10 trafik → kontrol %90
2. 2 hafta izleme
3. Guardrail bozulmuyorsa rollout

---

## 5) Web Uygulaması Entegrasyonu

### 5.1 API Tasarımı

**/recommendations**
- Input: user_id, session_id, context (device, time)
- Output: top-N item list + score

**/feedback**
- Input: user_id, item_id, action (view, like, skip), timestamp

### 5.2 Gerçek Zamanlı Akış
- Event stream: Kafka / Kinesis
- Feature update: streaming aggregation (son 24 saat izlemeler)

### 5.3 Ölçeklenebilirlik
- **Batch inference**: gece toplu skorlar
- **Online cache**: Redis (hot users)
- **Approx NN**: Faiss / ScaNN (embedding similarity)

---

## 6) Geliştirme Yol Haritası

### MVP (4-6 hafta)
- TF-IDF + basit CF (SVD/ALS)
- Basit API + offline evaluation

### Beta
- Sentence-BERT embedding + implicit feedback
- Basit fusion (weighted ensemble)
- A/B test altyapısı

### Production
- Neural CF + sequence-aware
- Online feature updates
- Monitoring + drift detection

---

## Ek: Risk Yönetimi

- **Sparsity**: implicit feedback + content embedding ile azaltılır.
- **Cold-start**: metadata + rule-based fallback.
- **Filter bubble**: çeşitlilik re-ranking + serendipity hedefi.
- **Explainability**: “çünkü X içeriklerini izledin” açıklamaları.

---

**Not**: Bu tasarım üretime hazırdır; ancak model seçimleri veri hacmine, latency ve maliyet hedeflerine göre adapte edilmelidir.
