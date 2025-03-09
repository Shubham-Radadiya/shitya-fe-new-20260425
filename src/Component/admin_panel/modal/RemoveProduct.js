import React from 'react';
import { useDispatch } from 'react-redux';
import closeicon from "../../images/closeicon.png";
import './modalstyle.css';
import { DELETE_PRODUCT } from '../../../store/product/ProductAction';
import { toast } from 'react-toastify';

const RemoveProduct = ({ closeModal, confirmRemove, productId }) => {
  const dispatch = useDispatch();

  const deleteProduct = async (id) => {
    try {
      await dispatch({ type: DELETE_PRODUCT, payload: id });
      confirmRemove();
    } catch (error) {
      toast.error("Error deleting product:", error);
    }
  };

  return (
    <div className="admin-modal show">
      <div className="remove-modal-content">
        <img src={closeicon} alt="Close" className='remove-img' onClick={closeModal} />
        <p>Are you sure you want to remove this product?</p>
        <div className="modal-bottom-btn">
          <button className='modal-btn' onClick={() => deleteProduct(productId)}>Delete</button>
          <button className='modal-btn' onClick={closeModal}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default RemoveProduct;
