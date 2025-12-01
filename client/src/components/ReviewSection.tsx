import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firestoreReviewService } from '../services/firestore';
import { firebaseAuthService } from '../services/firebaseAuth';
import { useAuthStore } from '../store/authStore';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import type { Review } from '../types';

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => firestoreReviewService.getByProduct(productId),
  });

  // Fetch average rating
  const { data: ratingData = { average: 0, count: 0 } } = useQuery({
    queryKey: ['rating', productId],
    queryFn: () => firestoreReviewService.getAverageRating(productId),
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) throw new Error('Must be logged in to review');

      return firestoreReviewService.create({
        productId,
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email || '',
        rating: data.rating,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['rating', productId] });
      setComment('');
      setRating(5);
      setShowForm(false);
      alert('Review submitted successfully! It will appear after admin approval.');
    },
    onError: (error: any) => {
      alert('Failed to submit review: ' + error.message);
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return firestoreReviewService.delete(reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['rating', productId] });
      alert('Review deleted successfully!');
    },
    onError: (error: any) => {
      alert('Failed to delete review: ' + error.message);
    },
  });

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    deleteReviewMutation.mutate(reviewId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      alert('Review must be at least 10 characters long');
      return;
    }
    createReviewMutation.mutate({ rating, comment });
  };

  const renderStars = (value: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <FiStar
              className={`w-5 h-5 ${
                star <= (interactive ? (hoveredRating || rating) : value)
                  ? 'fill-accent text-accent'
                  : 'text-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/4"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 pb-6 border-b border-white/10">
        <div className="text-center">
          <div className="text-4xl font-bold text-accent">{ratingData.average.toFixed(1)}</div>
          <div className="flex justify-center my-2">{renderStars(Math.round(ratingData.average))}</div>
          <div className="text-sm text-white/60">{ratingData.count} reviews</div>
        </div>
      </div>

      {/* Write Review Button */}
      {isAuthenticated && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Write a Review
        </button>
      )}

      {!isAuthenticated && (
        <p className="text-white/60 text-sm">
          Please <a href="/admin" className="text-accent hover:underline">sign in</a> to leave a review
        </p>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-glass p-6 space-y-4">
          <h3 className="text-xl font-semibold">Write Your Review</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Your Rating</label>
            {renderStars(rating, true)}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent transition-colors"
              placeholder="Share your thoughts about this product..."
              required
              minLength={10}
            />
            <p className="text-xs text-white/60 mt-1">Minimum 10 characters</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="btn-primary"
            >
              {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setComment('');
                setRating(5);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-white/60">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4">
            {(reviews as Review[]).map((review) => (
              <div key={review.id} className="card-glass p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{review.userName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-white/60">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete review"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
                <p className="text-white/80">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
